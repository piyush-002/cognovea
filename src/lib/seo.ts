import type { Metadata } from 'next';

/**
 * One page's title, description and URL, expanded into the four places they
 * have to agree.
 *
 * A page carries its title in `<title>`, `og:title` and `twitter:title`, its
 * description in three more, and its URL in `canonical` and `og:url`. Written
 * out by hand that is nine values per page, kept in step by discipline, and an
 * audit found Data Engineering serving three different titles: the page said
 * one thing, og:title another, and twitter:title a third inherited from the
 * root layout because the page never declared a twitter block at all.
 *
 * The third one is the instructive case. It was not a typo anyone could see in
 * the page file. Next merges metadata per top-level key, so a page that omits
 * `twitter` inherits the layout's whole twitter object, headline included.
 * Every page except one omitted it, so the entire site advertised a single
 * social title regardless of what any page was about.
 *
 * So the values are given once here and derived. The canonical stays relative,
 * resolved against `metadataBase` in the root layout, which is what made the
 * www change a one-line fix across all twelve pages rather than twelve edits.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  robots,
  publishedTime,
  modifiedTime,
}: {
  /** Used verbatim as the title, og:title and twitter:title. */
  title: string;
  /** Used verbatim as the description, og:description and twitter:description. */
  description: string;
  /** Route with a leading slash and no trailing one, e.g. '/about-us'. '/' for home. */
  path: string;
  /** Falls back to the site-wide card declared in the root layout. */
  image?: { url: string; alt?: string } | null;
  type?: 'website' | 'article';
  robots?: Metadata['robots'];
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  // Trailing slash, because `trailingSlash: true` means that is the URL that
  // actually resolves; a canonical pointing at the other spelling would name a
  // URL that redirects.
  const url = path === '/' ? '/' : `${path}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    openGraph: {
      type,
      title,
      description,
      url,
      ...(image ? { images: [{ url: image.url, alt: image.alt ?? title }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}
