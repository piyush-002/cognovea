import configPromise from '@payload-config';
import { getPayload } from 'payload';

/**
 * The local API. This talks to the database in-process, no HTTP, no network
 * hop, no API token, so it is both faster and safer than calling the REST API
 * from a server component.
 *
 * Payload caches the instance internally, so calling this per request is fine.
 */
export async function getPayloadClient() {
  return getPayload({ config: configPromise });
}

/**
 * Every content query goes through here so a database outage degrades the page
 * instead of taking the whole site down with a 500.
 *
 * This matters more than it looks: the ten marketing pages are the commercially
 * important ones and they do not touch Payload at all, so a database problem
 * should never be able to affect them. This keeps the same promise for the
 * pages that do. An empty insights list is a far better outcome than an error
 * page, and it keeps a transient Neon cold-start from failing a production
 * build.
 */
/**
 * Flattens a thrown value into something readable in a server log.
 *
 * Passing the raw error to console.error was a mistake: a server component's
 * console output crosses the RSC boundary before it reaches the terminal, and
 * anything that does not serialise arrives as `null`. The result was the log
 * line `[payload] getClients failed: null`, which names the query and then
 * withholds every fact needed to fix it.
 *
 * Postgres errors in particular carry the useful part outside `message` —
 * `code`, `detail`, `table`, `constraint` — and Payload wraps validation
 * failures in a `cause`. All of it is read off explicitly here and turned into
 * a string, because a string is the only thing guaranteed to survive the trip.
 */
function describe(error: unknown): string {
  if (error === null) return 'null was thrown (not an Error)';
  if (error === undefined) return 'undefined was thrown (not an Error)';
  if (typeof error === 'string') return error;

  const e = error as Record<string, unknown> & { message?: string; stack?: string };
  const parts: string[] = [];

  const ctor = error.constructor?.name;
  const name = typeof e.name === 'string' ? e.name : ctor;
  // 'Object' is not a name, it is the absence of one, and printing it crowds
  // out the fallback that would have shown what the thing actually contains.
  if (name && name !== 'Object') parts.push(name);
  if (e.message) parts.push(String(e.message));

  // node-postgres puts the diagnosis in these, and they are what actually
  // identifies a missing table or a failed constraint.
  for (const key of ['code', 'detail', 'hint', 'table', 'column', 'constraint', 'routine']) {
    const v = e[key];
    if (v !== undefined && v !== null && v !== '') parts.push(`${key}=${String(v)}`);
  }

  if (e.cause && e.cause !== error) parts.push(`cause: ${describe(e.cause)}`);

  // Nothing recognisable, or a shape with no message: fall back to the
  // contents. Something unreadable beats nothing readable.
  if (parts.length === 0 || !e.message) {
    let dump = '';
    try {
      dump = JSON.stringify(error) ?? '';
    } catch {
      dump = Object.prototype.toString.call(error);
    }
    if (dump && dump !== '{}') parts.push(dump);
  }

  if (parts.length === 0) return Object.prototype.toString.call(error);

  const summary = parts.join(' | ');
  return e.stack ? `${summary}\n${e.stack}` : summary;
}

/**
 * Whether a failure is the schema and the config having drifted apart.
 *
 * The Postgres code is not on the error that reaches us: Drizzle wraps the
 * driver's error, so `error.code` is undefined and `error.cause.code` is the
 * one that matters. The first version of this checked only the top level, so
 * the remedy never printed for the exact case it was written for — a missing
 * column after a field was added. The message said `code=42703` and then
 * offered no advice, which is a peculiar way to fail.
 *
 * 42P01 is an undefined table, 42703 an undefined column.
 */
function isSchemaDrift(error: unknown): boolean {
  const CODES = new Set(['42P01', '42703']);
  let current: unknown = error;
  // Bounded, because a cause chain can be circular.
  for (let depth = 0; current && depth < 8; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && CODES.has(code)) return true;
    const next = (current as { cause?: unknown }).cause;
    if (next === current) break;
    current = next;
  }
  return false;
}

export async function safeQuery<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // One string, deliberately. See describe() above.
    console.error(`[payload] ${label} failed: ${describe(error)}`);

    // The most common cause by far is that the schema and the collections have
    // drifted apart after a collection was added or a field renamed, and the
    // error for that is unhelpful unless you already know to look for it.
    if (isSchemaDrift(error)) {
      console.error(
        `[payload] ${label}: the database is missing a table or column the config expects.\n` +
          '          A collection or field was added and the schema has not caught up.\n' +
          '\n' +
          '            npm run migrate:create   # writes SQL to src/migrations — READ IT\n' +
          '            npm run migrate          # applies it\n' +
          '\n' +
          '          Read the generated SQL before applying it. Adding a field should\n' +
          '          produce only ALTER TABLE ... ADD COLUMN. Any DROP means the config\n' +
          '          and the database disagree about something else as well, and this\n' +
          '          database is shared with the deployed site.',
      );
    }

    return fallback;
  }
}
