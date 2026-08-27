import { getPayloadClient, safeQuery } from './payload';
import { site } from './site';

/**
 * Site-wide values, read from the Payload `site-settings` global with the
 * constants in `site.ts` as the fallback.
 *
 * Why the ten marketing pages still read `site.ts` directly rather than calling
 * this:
 *
 * Those pages carry copy that is verbatim from your source documents, and the
 * only reason I can still prove that is the render pipeline in tools/. It
 * compiles each page with esbuild and renders it with react-dom/server, with no
 * database and no npm install. The moment a marketing page imports Payload,
 * that pipeline can no longer run it, and the verbatim guarantee loses its
 * safety net at exactly the point where I also cannot run Payload locally.
 *
 * So the split is deliberate and temporary: new content routes use this,
 * marketing pages use the constants. Once you have run a successful build and
 * confirmed the admin works, moving the footer and the contact page onto this
 * is a small, safe follow-up, and at that point the settings become genuinely
 * editable without a deploy.
 */

export type ResolvedSettings = {
  email: string;
  phones: string[];
  offices: {
    role: string;
    label: string;
    address: string;
    locality: string;
    region: string;
    postalCode: string;
    country: string;
  }[];
  social: Record<string, string>;
};

const fallback: ResolvedSettings = {
  email: site.email,
  phones: [...site.phones],
  offices: [
    { ...site.locations.hq, address: site.locations.hq.address },
    { ...site.locations.dev, address: site.locations.dev.address },
  ],
  social: Object.fromEntries(Object.entries(site.social).filter(([, v]) => v)),
};

export async function getSiteSettings(): Promise<ResolvedSettings> {
  return safeQuery(
    async () => {
      const payload = await getPayloadClient();
      // Via `unknown`: the generated `SiteSetting` type has no index
      // signature, so TypeScript rejects the direct cast. The reads below are
      // all defensive and fall back field by field, so treating it as a bag of
      // unknowns is honest about what this function actually does with it.
      const doc = (await payload.findGlobal({
        slug: 'site-settings',
        depth: 0,
      })) as unknown as Record<string, unknown>;

      // Every field falls back individually. A half-filled global should degrade
      // field by field rather than dropping the whole site back to defaults.
      const phones = Array.isArray(doc?.phones)
        ? (doc.phones as { number?: string }[]).map((p) => p?.number).filter((n): n is string => Boolean(n))
        : [];

      const offices = Array.isArray(doc?.offices) ? (doc.offices as ResolvedSettings['offices']) : [];

      const social = Object.fromEntries(
        (['linkedin', 'instagram', 'facebook', 'youtube', 'x'] as const)
          .map((k) => [k, typeof doc?.[k] === 'string' ? (doc[k] as string) : ''])
          .filter(([, v]) => v),
      );

      return {
        email: typeof doc?.email === 'string' && doc.email ? doc.email : fallback.email,
        phones: phones.length ? phones : fallback.phones,
        offices: offices.length ? offices : fallback.offices,
        social: Object.keys(social).length ? social : fallback.social,
      };
    },
    fallback,
    'getSiteSettings',
  );
}
