'use server';

import { getPayloadClient } from '@/lib/payload';

/**
 * The only public write path into the database.
 *
 * A Server Action rather than a route handler, for one concrete reason: Payload
 * owns `/api/[...slug]`, so adding our own `/api/enquiry/route.ts` would collide
 * with it and fail the build. Actions also get Next's own origin checking for
 * free, and need no addition to the CSP beyond `form-action 'self'`.
 *
 * Everything here re-validates. The client component validates too, but that is
 * for the person filling the form in. It is trivially bypassed and is not a
 * security control.
 */

export type EnquiryResult = { ok: true } | { ok: false; error: string };

const LIMITS = {
  fullName: 120,
  workEmail: 200,
  phone: 40,
  companyName: 200,
  companySize: 40,
  industry: 80,
  hardestNumber: 300,
  goal: 4000,
  intent: 120,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max: number, multiline = false): string {
  if (typeof value !== 'string') return '';

  // Strip control characters, then cap the length. The cap matters: without it
  // a single request can push megabytes into a text column.
  //
  // Multiline fields keep their newlines. Stripping every control character is
  // right for a name or a company, but the message box is the one place where
  // paragraph breaks are content, and flattening someone's enquiry into a single
  // run-on line loses the shape of what they wrote.
  const stripped = multiline
    ? value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    : value.replace(/[\u0000-\u001f\u007f]/g, '');

  return stripped.trim().slice(0, max);
}

export async function submitEnquiry(formData: FormData): Promise<EnquiryResult> {
  // Honeypot. A real person never sees this field, so anything in it is a bot.
  // Returns success rather than an error: telling a scraper it was detected
  // just invites it to try again without the trap.
  if (clean(formData.get('website'), 200)) return { ok: true };

  const data = {
    fullName: clean(formData.get('fullName'), LIMITS.fullName),
    workEmail: clean(formData.get('workEmail'), LIMITS.workEmail),
    phone: clean(formData.get('phone'), LIMITS.phone),
    companyName: clean(formData.get('companyName'), LIMITS.companyName),
    companySize: clean(formData.get('companySize'), LIMITS.companySize),
    industry: clean(formData.get('industry'), LIMITS.industry),
    hardestNumber: clean(formData.get('hardestNumber'), LIMITS.hardestNumber),
    goal: clean(formData.get('goal'), LIMITS.goal, true),
    intent: clean(formData.get('intent'), LIMITS.intent),
  };

  if (!data.fullName) return { ok: false, error: 'Please enter your full name.' };
  if (!data.workEmail || !EMAIL.test(data.workEmail)) {
    return { ok: false, error: 'Please enter a valid work email address.' };
  }
  if (!data.companyName) return { ok: false, error: 'Please enter your company name.' };

  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: 'enquiries',
      data: { ...data, status: 'new' },
      // The collection denies public creates precisely so this is the only door.
      overrideAccess: true,
    });
    return { ok: true };
  } catch (error) {
    // Logged for us, generic for them: a database error message is not
    // something to render on a public page.
    console.error('[enquiry] failed to save:', error);
    return { ok: false, error: 'We could not save that just now.' };
  }
}
