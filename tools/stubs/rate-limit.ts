/**
 * Verification stub for the rate limiter. See tools/stubs/content.ts.
 *
 * Allows everything by default, because the suites that pull this in are
 * testing something else and a limiter that refuses would make them fail for
 * the wrong reason. The limiter's own behaviour — counting, windows,
 * concurrency, failing open — is exercised against a real PostgreSQL in
 * tools/test-rate-limit.mjs, which is the only place it can be tested honestly.
 *
 * Set `window.__rateLimit` (browser) or `globalThis.__rateLimit` (node) to
 * `{ allowed: false }` to make a test see a refusal.
 */
export type Verdict = { allowed: boolean; count: number; degraded: boolean };

export const calls: { name: string; key: string | null }[] = [];

export async function callerKey(): Promise<string | null> {
  return (globalThis as Record<string, unknown>).__callerKey as string ?? '198.51.100.7';
}

export async function rateLimit(name: string, key: string | null): Promise<Verdict> {
  calls.push({ name, key });
  const override = (globalThis as Record<string, unknown>).__rateLimit as Partial<Verdict> | undefined;
  return { allowed: true, count: 1, degraded: false, ...override };
}

export function redact(message: string): string {
  return message.replace(/([a-z][a-z0-9+.-]*:\/\/[^\s:/@]+):[^\s@]*@/gi, '$1:***@');
}

export const LIMITS = {
  enquiry: { limit: 3, windowSeconds: 3600 },
  toolLead: { limit: 5, windowSeconds: 3600 },
  summary: { limit: 40, windowSeconds: 3600 },
  mail: { limit: 20, windowSeconds: 3600 },
} as const;
