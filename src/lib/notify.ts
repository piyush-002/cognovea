import type { CollectionAfterChangeHook } from 'payload';
import { CANONICAL_URL } from '@/lib/host-redirect.mjs';

/**
 * Tells somebody a form was filled in.
 *
 * Until now nothing did. An enquiry landed in the admin and sat there, and the
 * only way to discover it was to go and look — which is a fine way to lose a
 * lead that came in on a Friday evening.
 *
 * Three rules hold everywhere in this file, and they are the reason it is
 * longer than a call to sendEmail:
 *
 *   1. A failed notification must never fail the submission. The visitor has
 *      done their part and the row is already saved; showing them an error
 *      because our mail provider is having a bad afternoon charges them for our
 *      problem. Every path here swallows its own errors and logs.
 *
 *   2. It must not hang. These run inside a serverless function that the
 *      platform will kill at its own timeout, and a request held open by a
 *      stuck TCP connection is a request the visitor is watching spin. The send
 *      is raced against a deadline.
 *
 *   3. Only on create. An afterChange hook fires again every time somebody
 *      edits the record in the admin — marking an enquiry "contacted" would
 *      otherwise email the team about it a second time.
 */

/** How long to wait for the provider before giving up and letting the request finish. */
const SEND_TIMEOUT_MS = 8000;

type Payload = {
  sendEmail: (args: { to: string; from?: string; subject: string; text: string }) => Promise<unknown>;
  logger?: { warn: (msg: string) => void };
};

/**
 * True when there is somewhere to send and something to send with.
 *
 * Local development usually has neither, and that is not a fault: Payload logs
 * its own warning once at startup when no adapter is configured, and repeating
 * it on every form submission would bury the log the developer is reading.
 */
function target(): string | null {
  const to = process.env.EMAIL_NOTIFY?.trim();
  if (!to) return null;
  if (!process.env.RESEND_API_KEY?.trim()) return null;
  return to;
}

/** Send, but never for longer than the deadline and never throwing. */
async function send(payload: Payload, subject: string, text: string, label: string): Promise<boolean> {
  const to = target();
  if (!to) return false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out after ${SEND_TIMEOUT_MS}ms`)), SEND_TIMEOUT_MS);
    });

    await Promise.race([
      payload.sendEmail({
        to,
        from: process.env.EMAIL_FROM?.trim() || undefined,
        subject,
        text,
      }),
      deadline,
    ]);
    return true;
  } catch (error) {
    // The message, never the error object: a provider's rejection can carry the
    // request it was given, and that request contains the API key.
    console.warn(`[notify] ${label}: not sent —`, (error as Error)?.message ?? 'unknown error');
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Where in the admin to find the record. Built from the request, not hardcoded. */
function adminLink(collection: string, id: string | number): string {
  // NEXT_PUBLIC_SERVER_URL is localhost in development, which is what you want
  // in a notification you are reading on the machine that produced it.
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || CANONICAL_URL).replace(/\/+$/, '');
  return `${base}/admin/collections/${collection}/${id}`;
}

/**
 * A new contact-form submission.
 *
 * The whole enquiry goes in the body deliberately. Somebody reading this on a
 * phone should be able to decide whether it needs answering tonight without
 * logging in.
 */
export const notifyOnEnquiry: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc;

  const d = doc as Record<string, any>;
  const lines = [
    `${d.fullName ?? 'Someone'} <${d.workEmail ?? 'no address'}>`,
    d.companyName ? `${d.companyName}${d.companySize ? ` · ${d.companySize}` : ''}` : null,
    d.industry ? `Industry: ${d.industry}` : null,
    d.phone ? `Phone: ${d.phone}` : null,
    d.intent ? `From: ${d.intent}` : null,
    '',
    d.hardestNumber ? `Hardest number to get:\n${d.hardestNumber}\n` : null,
    d.goal ? `What they want:\n${d.goal}\n` : null,
    adminLink('enquiries', d.id),
  ].filter((l) => l !== null);

  await send(
    req.payload as unknown as Payload,
    `New enquiry — ${d.fullName ?? 'unknown'}${d.companyName ? ` (${d.companyName})` : ''}`,
    lines.join('\n'),
    'enquiry',
  );

  return doc;
};

/**
 * Somebody downloaded a tool summary.
 *
 * Lower priority than an enquiry and the subject line says so, because these
 * are not people who asked to be called. The figures they entered go in the
 * body: they are the only part worth reading, and they are the reason this
 * collection exists separately from enquiries.
 */
export const notifyOnToolLead: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc;

  const d = doc as Record<string, any>;
  const lines = [
    d.email,
    `Tool: ${d.tool ?? 'unknown'}`,
    '',
    d.summary || 'No figures recorded.',
    '',
    d.shareUrl ? `Their result: ${d.shareUrl}` : null,
    adminLink('tool-leads', d.id),
  ].filter((l) => l !== null);

  await send(
    req.payload as unknown as Payload,
    `Tool download — ${d.email ?? 'unknown'}`,
    lines.join('\n'),
    'tool-lead',
  );

  return doc;
};
