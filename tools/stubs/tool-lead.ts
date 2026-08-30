/**
 * Verification stub for the tool-lead server action. See tools/stubs/content.ts.
 *
 * The real action needs Payload and a database, neither of which exists in a
 * browser. What the UI test cares about is the contract: what the component
 * does with {ok:true} and what it does with {ok:false}. Both are reachable
 * here by setting window.__leadResult before submitting.
 */
export type ToolLeadResult = { ok: true } | { ok: false; error: string };

export async function submitToolLead(form: FormData): Promise<ToolLeadResult> {
  const w = window as unknown as { __leadCalls?: unknown[]; __leadResult?: ToolLeadResult };
  w.__leadCalls = w.__leadCalls || [];
  w.__leadCalls.push({ email: form.get('email'), website: form.get('website'), inputs: form.get('inputs') });
  return w.__leadResult || { ok: true };
}
