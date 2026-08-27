/** Verification stub for the enquiry server action. See tools/stubs/content.ts. */
export type EnquiryResult = { ok: true } | { ok: false; error: string };
export async function submitEnquiry(): Promise<EnquiryResult> {
  return { ok: true };
}
