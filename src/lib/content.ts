import { toSameOriginPath } from './media-url';
import { getPayloadClient, safeQuery } from './payload';

/**
 * Content queries for the Payload-backed routes.
 *
 * Every one of these goes through `safeQuery`, so a database problem produces
 * an empty list rather than a 500. See the note in lib/payload.ts.
 */

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  updatedAt: string | null;
  readingMinutes: number | null;
  tags: string[];
  heroImage: { url: string; alt: string; width?: number; height?: number } | null;
};

type MediaLike = { url?: string; alt?: string; width?: number; height?: number } | string | null | undefined;

type Img = { url: string; alt: string; width?: number; height?: number } | null;

function media(m: MediaLike): Img {
  if (!m || typeof m === 'string' || !m.url) return null;
  // Payload returns absolute URLs built from serverURL. next/image rejects any
  // absolute URL whose host is not in images.remotePatterns, so same-origin
  // uploads are made relative here, once, for every collection.
  return {
    url: toSameOriginPath(m.url, process.env.NEXT_PUBLIC_SERVER_URL),
    alt: m.alt ?? '',
    width: m.width,
    height: m.height,
  };
}

function summarise(doc: Record<string, any>): PostSummary {
  return {
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? '',
    publishedAt: doc.publishedAt ?? null,
    updatedAt: doc.updatedAt ?? null,
    readingMinutes: doc.readingMinutes ?? null,
    tags: Array.isArray(doc.tags) ? doc.tags.map((t: { tag?: string }) => t?.tag).filter(Boolean) : [],
    heroImage: media(doc.heroImage),
  };
}

export async function getPosts(limit = 24): Promise<PostSummary[]> {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: 'posts',
        limit,
        depth: 1,
        sort: '-publishedAt',
        // Belt and braces: access control already constrains anonymous reads to
        // published docs, but the local API runs with no user at all, which
        // bypasses access control by design. So the filter is explicit here.
        where: { _status: { equals: 'published' } },
        overrideAccess: false,
      });
      return res.docs.map(summarise);
    },
    [],
    'getPosts',
  );
}

export async function getPost(slug: string) {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: 'posts',
        limit: 1,
        depth: 1,
        where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
        overrideAccess: false,
      });
      return res.docs[0] ?? null;
    },
    null,
    `getPost(${slug})`,
  );
}

export type JobSummary = {
  id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  workplace: string;
  experience: string | null;
  summary: string;
  validThrough: string;
  publishedAt: string | null;
  applyEmail: string;
  location: { city: string; region: string; country: string } | null;
  description: unknown;
};

/**
 * Open roles only. A posting past its `validThrough` disappears from the site
 * without anyone having to remember to unpublish it, which is both the honest
 * behaviour for a candidate and what search engines expect from a JobPosting.
 */
export async function getOpenJobs(): Promise<JobSummary[]> {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: 'jobs',
        limit: 50,
        depth: 0,
        sort: '-publishedAt',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { validThrough: { greater_than_equal: new Date().toISOString() } },
          ],
        },
        overrideAccess: false,
      });
      return res.docs.map((d: Record<string, any>) => ({
        id: String(d.id),
        title: d.title,
        slug: d.slug,
        department: d.department,
        employmentType: d.employmentType,
        workplace: d.workplace,
        experience: d.experience ?? null,
        summary: d.summary ?? '',
        validThrough: d.validThrough,
        publishedAt: d.publishedAt ?? null,
        applyEmail: d.applyEmail,
        location: d.location ?? null,
        description: d.description,
      }));
    },
    [],
    'getOpenJobs',
  );
}

/** Stable server-side formatting, so the server and client markup always agree. */
export function formatDate(value: string | null): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  'data-engineering': 'Data Engineering',
  'analytics-bi': 'Analytics & BI',
  'ai-ml': 'AI & Machine Learning',
  consulting: 'Consulting & Strategy',
  design: 'Design',
  operations: 'Operations',
};

export const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACTOR: 'Contract',
  INTERN: 'Internship',
  TEMPORARY: 'Temporary',
};

export const WORKPLACE_LABELS: Record<string, string> = {
  onsite: 'On site',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

// --------------------------------------------------------------- clients ---

export type ClientLogo = {
  id: string;
  name: string;
  website: string | null;
  scale: number;
  logo: { url: string; alt: string; width?: number; height?: number } | null;
};

export async function getClients(featuredOnly = false, limit = 24): Promise<ClientLogo[]> {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: 'clients',
        limit,
        depth: 1,
        sort: 'order',
        where: { and: [{ _status: { equals: 'published' } }, ...(featuredOnly ? [{ featured: { equals: true } }] : [])] },
        overrideAccess: false,
      });

      return res.docs
        .map((d: Record<string, any>) => ({
          id: String(d.id),
          name: d.name,
          website: d.website || null,
          // Clamped here as well as in the field: a value typed straight into
          // the database should not be able to blow the row apart.
          scale: Math.min(Math.max(Number(d.scale) || 1, 0.5), 2),
          logo: media(d.logo),
        }))
        // A logo record with no usable image would render an empty box.
        .filter((c) => c.logo?.url);
    },
    [],
    'getClients',
  );
}

// ---------------------------------------------------------- testimonials ---

export type Testimonial = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  companyName: string | null;
  photo: { url: string; alt: string; width?: number; height?: number } | null;
  clientLogo: { url: string; alt: string } | null;
};

function toTestimonial(d: Record<string, any>): Testimonial {
  const client = d.client && typeof d.client === 'object' ? d.client : null;
  return {
    id: String(d.id),
    quote: d.quote,
    authorName: d.authorName,
    authorRole: d.authorRole || null,
    companyName: d.companyName || client?.name || null,
    photo: media(d.photo),
    clientLogo: client ? media(client.logo) : null,
  };
}

/**
 * Testimonials for a page.
 *
 * When `service` is given, quotes tagged for that page are preferred and a
 * general quote is used only if none match. A quote about data engineering
 * sitting on the Generative AI page reads as filler, which is worse than
 * showing nothing.
 */
export async function getTestimonials(
  { service, limit = 1 }: { service?: string; limit?: number } = {},
): Promise<Testimonial[]> {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const base = [{ _status: { equals: 'published' } }];

      if (service) {
        const targeted = await payload.find({
          collection: 'testimonials',
          limit,
          depth: 1,
          sort: 'order',
          where: { and: [...base, { services: { contains: service } }] },
          overrideAccess: false,
        });
        if (targeted.docs.length) return targeted.docs.map(toTestimonial);
      }

      const res = await payload.find({
        collection: 'testimonials',
        limit,
        depth: 1,
        sort: 'order',
        where: { and: [...base, ...(service ? [] : [{ featured: { equals: true } }])] },
        overrideAccess: false,
      });
      return res.docs.map(toTestimonial);
    },
    [],
    `getTestimonials(${service ?? 'any'})`,
  );
}
