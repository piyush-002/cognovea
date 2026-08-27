/**
 * Structured-data builders.
 *
 * These live in lib/ rather than alongside the components on purpose: page.tsx
 * files are Server Components, and a Server Component cannot call a function
 * exported from a 'use client' module, Next.js turns those exports into client
 * references, not callable functions. Keeping the builders here means the same
 * data can feed both the visible UI (client) and the JSON-LD (server).
 */

import { abs, site } from './site';
import type { JobSummary, PostSummary } from './content';

export type FaqItem = {
  q: string;
  /** One string, or several paragraphs. */
  a: string | string[];
};

/** FAQPage, built from the exact items the accordion renders, so the two can't drift. */
export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: Array.isArray(item.a) ? item.a.join(' ') : item.a,
      },
    })),
  };
}

/** BlogPosting for an article under /insights. */
export function articleSchema(post: PostSummary & { updatedAt?: string | null }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title.slice(0, 110),
    description: post.excerpt,
    url: abs(`/insights/${post.slug}`),
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(`/insights/${post.slug}`) },
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt ?? post.publishedAt ?? undefined,
    image: post.heroImage?.url ? [post.heroImage.url] : [abs('/og.png')],
    keywords: post.tags.length ? post.tags.join(', ') : undefined,
    author: { '@type': 'Organization', name: site.name, url: abs('/') },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: abs('/'),
      logo: { '@type': 'ImageObject', url: abs('/og.png') },
    },
  };
}

/**
 * JobPosting. The schema that makes a role eligible for the Google Jobs box.
 *
 * `hiringOrganization`, `datePosted` and `validThrough` are all required for
 * eligibility, and a remote role must carry `jobLocationType: TELECOMMUTE`
 * together with `applicantLocationRequirements` instead of a street address.
 * Getting that wrong is the usual reason a posting silently fails to appear.
 */
export function jobPostingSchema(job: JobSummary) {
  const isRemote = job.workplace === 'remote';

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.summary,
    identifier: { '@type': 'PropertyValue', name: site.name, value: job.slug },
    datePosted: job.publishedAt ?? undefined,
    validThrough: job.validThrough,
    employmentType: job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: site.name,
      sameAs: abs('/'),
      logo: abs('/og.png'),
    },
    directApply: true,
    ...(isRemote
      ? {
          jobLocationType: 'TELECOMMUTE',
          applicantLocationRequirements: { '@type': 'Country', name: 'India' },
        }
      : {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.location?.city ?? site.locations.hq.locality,
              addressRegion: job.location?.region ?? 'Karnataka',
              addressCountry: job.location?.country ?? 'IN',
            },
          },
        }),
  };
}
