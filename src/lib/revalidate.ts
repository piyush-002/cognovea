import { revalidatePath } from 'next/cache';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

/**
 * The marketing pages are statically generated, which is the whole reason they
 * are fast. The cost is that a page rendered at build time keeps serving that
 * build's HTML until something tells Next to render it again.
 *
 * Every page here also carries `export const revalidate = 300`, so nothing can
 * go stale for longer than five minutes even if this file never runs. These
 * hooks exist so an editor who publishes a logo does not have to sit and wonder
 * for those five minutes: the page is rebuilt on the next request instead.
 *
 * Wrapped, because `revalidatePath` needs Next's request context and this
 * config is also loaded by `payload migrate` and by scripts, where there is no
 * such context. A revalidation that cannot run is not a reason to fail the save
 * that triggered it; the time-based revalidate still covers it.
 */
function refresh(paths: string[], label: string) {
  for (const path of paths) {
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

export const revalidateMarketing: CollectionAfterChangeHook = ({ doc, collection }) => {
  refresh(MARKETING_PATHS, collection.slug);
  return doc;
};

export const revalidateMarketingOnDelete: CollectionAfterDeleteHook = ({ doc, collection }) => {
  refresh(MARKETING_PATHS, collection.slug);
  return doc;
};
