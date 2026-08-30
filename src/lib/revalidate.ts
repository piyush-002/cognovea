import { revalidatePath } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';

/**
 * The public pages are statically generated, which is the whole reason they are
 * fast. The cost is that a page rendered at build time keeps serving that
 * build's HTML until something tells Next to render it again.
 *
 * Every page that shows CMS content also carries `export const revalidate`, so
 * nothing can go stale for longer than five minutes even if this file never
 * runs. These hooks exist so an editor who publishes something does not have to
 * sit and wonder for those five minutes: the affected pages are rebuilt on the
 * next request instead.
 *
 * Wrapped, because `revalidatePath` needs Next's request context and this
 * config is also loaded by `payload migrate` and by scripts, where there is no
 * such context. A revalidation that cannot run is not a reason to fail the save
 * that triggered it; the time-based revalidate still covers it.
 */
function refresh(paths: (string | null | undefined)[], label: string) {
  for (const path of paths) {
    if (!path) continue;
    try {
      revalidatePath(path);
    } catch (error) {
      console.warn(`[revalidate] ${label}: could not refresh ${path}`, (error as Error)?.message);
    }
  }
}

/** Every page that renders a logo strip or a testimonial. */
export const MARKETING_PATHS = [
  '/',
  '/about-us',
  '/data-health-check',
  '/data-engineering-services',
  '/data-modernization-services',
  '/ai-strategy-consulting',
  '/generative-ai-services',
];

/**
 * Builds the hook pair for a collection.
 *
 * `paths` receives the document so a collection with its own detail route can
 * refresh that URL as well as its index. An unpublished draft still refreshes
 * the index: unpublishing must remove a card as promptly as publishing adds
 * one, and the hook cannot tell the two apart from the new document alone.
 *
 * The sitemap is included wherever a document has a URL of its own, otherwise
 * it advertises pages that have gone and omits ones that have arrived.
 */
export function revalidateFor(paths: (doc: Record<string, any>) => (string | null | undefined)[]) {
  const afterChange: CollectionAfterChangeHook = ({ doc, collection }) => {
    refresh(paths(doc as Record<string, any>), collection.slug);
    return doc;
  };
  const afterDelete: CollectionAfterDeleteHook = ({ doc, collection }) => {
    refresh(paths(doc as Record<string, any>), collection.slug);
    return doc;
  };
  return { afterChange: [afterChange], afterDelete: [afterDelete] };
}

/** Clients and Testimonials appear across the marketing pages, nowhere else. */
export const marketingHooks = revalidateFor(() => MARKETING_PATHS);

/** A post has an index, a page of its own, and a line in the sitemap. */
export const postHooks = revalidateFor((doc) => [
  '/insights',
  doc?.slug ? `/insights/${doc.slug}` : null,
  '/sitemap.xml',
]);


/** Jobs are listed on Careers and carry JobPosting structured data. */
export const jobHooks = revalidateFor(() => ['/careers']);

/**
 * Everything under the root layout, which on this site is every public page.
 *
 * Reached for by the two surfaces whose content is not confined to known
 * routes: Site Settings appears in the header and footer of every page, and a
 * replaced image could be on any of them. Both are edited rarely, so the cost
 * of rebuilding broadly is close to nothing and the alternative — guessing
 * which pages used a given file — would be wrong the first time it mattered.
 */
function refreshEverything(label: string) {
  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    console.warn(`[revalidate] ${label}: could not refresh the site`, (error as Error)?.message);
  }
}

/** Media: a replaced or re-cropped file could appear anywhere. */
export const mediaHooks = {
  afterChange: [
    (({ doc, collection }) => {
      refreshEverything(collection.slug);
      return doc;
    }) as CollectionAfterChangeHook,
  ],
  afterDelete: [
    (({ doc, collection }) => {
      refreshEverything(collection.slug);
      return doc;
    }) as CollectionAfterDeleteHook,
  ],
};

/** Site Settings: header, footer, contact details, offices, social profiles. */
export const siteSettingsHooks = {
  afterChange: [
    (({ doc }: { doc: unknown }) => {
      refreshEverything('site-settings');
      return doc;
    }) as GlobalAfterChangeHook,
  ],
};
