import { getPayloadClient, safeQuery } from '@/lib/payload';

/**
 * Reading the portfolio.
 *
 * `depth: 2` throughout, and that is not a tuning knob. Uploads inside a blocks
 * field come back as bare ids at depth 1, so the body renders with every image
 * missing and nothing errors — the page just quietly loses its pictures. That
 * exact bug cost an afternoon on the Insights blocks already.
 *
 * Every query is wrapped in safeQuery, so a database outage produces an empty
 * portfolio rather than a failed build or a 500.
 */

export type PortfolioSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  kind: 'product' | 'client';
  sector: string | null;
  /** Already resolved against permission — never the raw field. */
  attribution: string | null;
  cover: { url: string; alt: string; width: number | null; height: number | null } | null;
  featured: boolean;
  publishedAt: string | null;
  noindex: boolean;
};

const SECTOR_LABEL: Record<string, string> = {
  manufacturing: 'Manufacturing',
  'oil-and-gas': 'Oil & Gas',
  fintech: 'Fintech',
  'retail-ecommerce': 'Retail & E-commerce',
  healthcare: 'Healthcare',
  logistics: 'Logistics',
  'cross-industry': 'Cross-industry',
};

export const sectorLabel = (id?: string | null): string | null => (id ? SECTOR_LABEL[id] ?? null : null);

function cover(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const m = value as { url?: string; alt?: string; width?: number; height?: number };
  return m.url ? { url: m.url, alt: m.alt || '', width: m.width ?? null, height: m.height ?? null } : null;
}

/**
 * The label above the title: what kind of study this is, and who it was for.
 *
 * Every entry is a case study — of a product we built, or of work we did for
 * somebody. `kind` still decides whether the client fields apply, but it is no
 * longer surfaced as the word "Product", which read as a datasheet rather than
 * as a piece of work.
 */
export function studyLabel(kind: 'product' | 'client', attribution: string | null): string {
  return kind === 'product' ? 'Case study' : `Case study · ${attribution ?? 'Client work'}`;
}

/**
 * How an entry is attributed on the page.
 *
 * A client name appears only when somebody has ticked the permission box. With
 * it unticked the sector stands in, which is how most client work has to be
 * described anyway. Resolved here rather than in a template so there is one
 * place this decision is made, and so a new page cannot get it wrong by
 * reaching for `clientName` directly.
 */
function attribution(doc: Record<string, any>): string | null {
  if (doc.kind !== 'client') return null;
  if (doc.clientPermission && doc.clientName) return doc.clientName;
  const label = sectorLabel(doc.sector);
  return label ? `A ${label.toLowerCase()} client` : 'A client';
}

function toSummary(doc: Record<string, any>): PortfolioSummary {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary ?? '',
    kind: doc.kind === 'client' ? 'client' : 'product',
    sector: doc.sector ?? null,
    attribution: attribution(doc),
    cover: cover(doc.coverImage),
    featured: Boolean(doc.featured),
    publishedAt: doc.publishedAt ?? null,
    noindex: Boolean(doc.noindex),
  };
}

/** Published entries, featured first, then newest. */
export async function getPortfolio(limit = 60): Promise<PortfolioSummary[]> {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: 'portfolio',
        limit,
        depth: 2,
        sort: '-publishedAt',
        where: { _status: { equals: 'published' } },
        overrideAccess: false,
      });
      const items = res.docs.map(toSummary);
      // Featured pinned to the top, order otherwise preserved from the sort.
      return [...items.filter((i) => i.featured), ...items.filter((i) => !i.featured)];
    },
    [],
    'getPortfolio',
  );
}

/** One entry, with its body resolved deeply enough for the images to exist. */
export async function getPortfolioEntry(slug: string) {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      const res = await payload.find({
        collection: 'portfolio',
        limit: 1,
        depth: 2,
        where: { slug: { equals: slug }, _status: { equals: 'published' } },
        overrideAccess: false,
      });
      const doc = res.docs[0];
      if (!doc) return null;
      return { ...toSummary(doc as Record<string, any>), body: (doc as Record<string, any>).body ?? [] };
    },
    null,
    'getPortfolioEntry',
  );
}
