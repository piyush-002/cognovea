/**
 * Verification stub for '@/lib/content'.
 *
 * The preview harness has no database and cannot install Payload, so importing
 * the real module would pull the whole Payload dependency tree into the bundle
 * and fail. Stubbing it here keeps the harness able to render the pages whose
 * verbatim copy still needs proving. The empty results also exercise each
 * page's empty state, which is what a fresh production database will look like
 * on launch day anyway.
 */
export type PostSummary = {
  id: string; title: string; slug: string; excerpt: string;
  publishedAt: string | null; updatedAt: string | null;
  readingMinutes: number | null; tags: string[];
  heroImage: { url: string; alt: string; width?: number; height?: number } | null;
};

export type JobSummary = {
  id: string; title: string; slug: string; department: string;
  employmentType: string; workplace: string; experience: string | null;
  summary: string; validThrough: string; publishedAt: string | null;
  applyEmail: string; location: { city: string; region: string; country: string } | null;
  description: unknown;
};

export async function getPosts(): Promise<PostSummary[]> { return []; }
export async function getPost(): Promise<null> { return null; }
export async function getOpenJobs(): Promise<JobSummary[]> { return []; }
export function formatDate(): string { return ''; }
export const DEPARTMENT_LABELS: Record<string, string> = {};
export const EMPLOYMENT_LABELS: Record<string, string> = {};
export const WORKPLACE_LABELS: Record<string, string> = {};

export type ClientLogo = {
  id: string; name: string; website: string | null; scale: number;
  logo: { url: string; alt: string; width?: number; height?: number } | null;
};

export type Testimonial = {
  id: string; quote: string; authorName: string; authorRole: string | null;
  companyName: string | null;
  photo: { url: string; alt: string; width?: number; height?: number } | null;
  clientLogo: { url: string; alt: string } | null;
};

export async function getClients(): Promise<ClientLogo[]> { return []; }
export async function getTestimonials(): Promise<Testimonial[]> { return []; }
