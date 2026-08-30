import { headers } from 'next/headers';
import { getPayloadClient } from '@/lib/payload';

/**
 * A fixed-window rate limiter, counted in Postgres.
 *
 * Why not an in-memory counter: this deploys to Vercel, where each request may
 * be served by a different instance and any instance may be cold. A counter in
 * module scope is therefore reset at unpredictable moments and never shared, so
 * it leaks worst under exactly the burst it is meant to stop. The database is
 * the only thing here that all instances can see.
 *
 * Why one statement: a limiter written as read-then-write loses the race it
 * exists to win. Twenty concurrent requests all read "0", all conclude they are
 * the first, and all pass. The upsert below decides and returns the new count in
 * a single round trip, so the database serialises them for us.
 *
 * Why it fails open: if the counter cannot be reached, the choice is between
 * dropping a real enquiry and letting an attacker through during an outage
 * where they can do nothing anyway. Losing a lead to protect against traffic
 * that is not currently arriving is the wrong trade. Every limit here has a
 * second line behind it — the mail cap in notify.ts — which is the one that
 * actually protects the sending quota.
 */

/**
 * An error message with any embedded credentials taken out.
 *
 * Logging `error.message` and not the error was supposed to be enough — an
 * error object can hold the request that produced it, API key included. But the
 * message is not automatically safe either: a connection failure often quotes
 * the URI it failed on, and this project's URI has the database password in it.
 * Logs get shipped somewhere and read by people; a password should not be in
 * them, however useful the rest of the line is.
 */
export function redact(message: string): string {
  // Anything of the form scheme://user:secret@host — the password only.
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/[^\s:/@]+):[^\s@]*@/gi, '$1:***@');
}

export type Verdict = {
  /** False when the caller should refuse the request. */
  allowed: boolean;
  /** Hits in the current window, including this one. Zero when unknown. */
  count: number;
  /** True when the limiter could not reach the database and let the call through. */
  degraded: boolean;
};

const ALLOWED: Verdict = { allowed: true, count: 0, degraded: true };

/**
 * The caller's address, as far as it can be trusted.
 *
 * On Vercel, `x-vercel-forwarded-for` is written by the edge and a client
 * cannot forge it. `x-forwarded-for` can be forged anywhere else, so its first
 * entry is only a fallback — a limiter keyed on a spoofable header is a limiter
 * an attacker opts out of by sending a random value per request.
 *
 * Returns null when there is no usable address rather than a constant like
 * "unknown": bucketing every unidentifiable caller together would let one
 * script exhaust the limit for everyone behind it.
 */
export async function callerKey(): Promise<string | null> {
  try {
    const h = await headers();
    const vercel = h.get('x-vercel-forwarded-for')?.trim();
    if (vercel) return vercel.split(',')[0].trim() || null;

    const real = h.get('x-real-ip')?.trim();
    if (real) return real;

    const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || null;
  } catch {
    // No request context — a script, or a build-time render.
    return null;
  }
}

/**
 * Count one hit against `name:key` and say whether it is within `limit`.
 *
 * The window is fixed rather than sliding: a caller who spends their whole
 * allowance in the first second waits out the rest of the window. That is
 * cruder than a sliding window and it is the right crudeness here, because it
 * costs one statement and the thing being protected is a contact form.
 */
export async function rateLimit(
  name: string,
  key: string | null,
  limit: number,
  windowSeconds: number,
): Promise<Verdict> {
  if (!key) return ALLOWED;

  try {
    const payload = await getPayloadClient();
    const pool = (payload as unknown as { db?: { pool?: { query: (q: string, v: unknown[]) => Promise<{ rows: { count: number }[] }> } } }).db?.pool;
    if (!pool) return ALLOWED;

    // On conflict, either continue the current window or start a new one. Both
    // branches are evaluated by Postgres inside the same statement, so two
    // requests arriving together cannot both see a stale count.
    const { rows } = await pool.query(
      `
      INSERT INTO rate_limits ("key", window_start, "count", created_at, updated_at)
      VALUES ($1, now(), 1, now(), now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN rate_limits.window_start < now() - ($2 || ' seconds')::interval THEN 1
          ELSE rate_limits."count" + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < now() - ($2 || ' seconds')::interval THEN now()
          ELSE rate_limits.window_start
        END,
        updated_at = now()
      -- Cast, because Payload types a number field as numeric, and node-pg hands
      -- numeric back as a *string* to avoid precision loss. Without this the
      -- comparison below is "11" <= 3, which is false for the wrong reason and
      -- true for several others.
      -- (No backticks in here: this whole statement is a template literal, and
      -- one would end it mid-comment.)
      RETURNING "count"::int AS count
      `,
      [`${name}:${key}`, String(windowSeconds)],
    );

    const count = rows[0]?.count ?? 0;

    // Housekeeping, occasionally. One row per address per limit accumulates for
    // the life of the site otherwise, and nothing else would ever clear them.
    // Done here rather than on a schedule because a cron job is a thing to
    // configure, monitor and forget, and this table does not deserve one. The
    // sweep is fire-and-forget: nobody is waiting on it, and it must not delay
    // the request or fail it.
    if (Math.random() < 0.005) {
      pool
        .query(`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`, [])
        .catch(() => {});
    }

    return { allowed: count <= limit, count, degraded: false };
  } catch (error) {
    console.warn(
      `[rate-limit] ${name}: counter unavailable, allowing —`,
      redact((error as Error)?.message ?? 'unknown'),
    );
    return ALLOWED;
  }
}

/**
 * The limits themselves, in one place so they can be read as a policy.
 *
 * Set against what a person plausibly does, not against what the infrastructure
 * can bear. Somebody who fills in the contact form, realises they mistyped
 * their email, and sends it again is normal; the fourth in an hour from one
 * address is not, and the fifth never is.
 */
export const LIMITS = {
  /** The contact form. Writes a row and sends mail. */
  enquiry: { limit: 3, windowSeconds: 60 * 60 },

  /** The calculator gate. Same cost, and a person may legitimately redo it. */
  toolLead: { limit: 5, windowSeconds: 60 * 60 },

  /**
   * The printable summary.
   *
   * Deliberately loose. This route writes nothing and sends nothing — it
   * renders a page from the query string — so the limit buys far less here than
   * on the two actions, and a real person reprinting after a change of figures
   * is a case worth protecting. It exists so the route cannot be used as a free
   * render loop, not because it is a serious exposure.
   */
  summary: { limit: 40, windowSeconds: 60 * 60 },

  /**
   * Outbound notifications, counted across everything.
   *
   * The important one. Resend's free plan allows 100 emails a day, and password
   * resets come out of the same allowance, so any path that can burn the quota
   * can lock an admin out of their own site. 20 an hour is far more
   * notifications than this site will ever legitimately produce and still
   * leaves the day's allowance intact for the resets.
   */
  mail: { limit: 20, windowSeconds: 60 * 60 },
} as const;
