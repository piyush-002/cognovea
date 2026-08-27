import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import JsonLd from '@/components/JsonLd';
import RichText from '@/components/RichText';
import { formatDate, getPost, getPosts } from '@/lib/content';
import { toSameOriginPath } from '@/lib/media-url';
import { articleSchema } from '@/lib/schema';

export const revalidate = 300;

/**
 * Prerender every published article at build time. Anything published later is
 * generated on first request and then cached, because `dynamicParams` defaults
 * to true, so a new post is live without a redeploy but still served as static
 * HTML to everyone after the first visitor.
 */
export async function generateStaticParams() {
  const posts = await getPosts(100);
  return posts.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPost(slug)) as Record<string, any> | null;
  if (!post) return { title: 'Article not found' };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const image = post.heroImage?.url;

  return {
    title,
    description,
    alternates: { canonical: `/insights/${slug}/` },
    // Lets an editor keep a published article out of search without unpublishing it.
    robots: post.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/insights/${slug}/`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      images: image ? [{ url: image, alt: post.heroImage?.alt ?? title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const post = (await getPost(slug)) as Record<string, any> | null;

  if (!post) notFound();

  const crumbs = [
    { href: '/insights', label: 'Insights' },
    { href: `/insights/${slug}`, label: post.title },
  ];

  const summary = {
    id: String(post.id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    publishedAt: post.publishedAt ?? null,
    readingMinutes: post.readingMinutes ?? null,
    tags: Array.isArray(post.tags) ? post.tags.map((t: { tag?: string }) => t?.tag).filter(Boolean) : [],
    // Through the same normaliser as every other upload: Payload returns an
    // absolute URL and next/image rejects hosts outside remotePatterns. Note
    // this is only for the on-page <Image>; the Open Graph tags above keep the
    // absolute URL, because a social crawler has no origin to resolve a
    // relative path against.
    heroImage: post.heroImage?.url
      ? {
          url: toSameOriginPath(post.heroImage.url, process.env.NEXT_PUBLIC_SERVER_URL),
          alt: post.heroImage.alt ?? '',
          width: post.heroImage.width,
          height: post.heroImage.height,
        }
      : null,
    updatedAt: post.updatedAt ?? null,
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), articleSchema(summary)]} />

      <PageHero
        eyebrow="Insight"
        title={post.title}
        crumbs={crumbs}
        compact
        intro={post.excerpt}
      >
        <p className="eyebrow" style={{ marginTop: '1.4em' }}>
          {formatDate(post.publishedAt)}
          {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ''}
        </p>
      </PageHero>

      <article className="band">
        <div className="wrap">
          {summary.heroImage?.url && (
            <div className="figure figure--wide rv" style={{ marginBottom: '2.4rem' }}>
              <Image
                src={summary.heroImage.url}
                alt={summary.heroImage.alt}
                width={summary.heroImage.width ?? 1600}
                height={summary.heroImage.height ?? 900}
                sizes="(max-width: 899px) 100vw, 70vw"
                priority
              />
            </div>
          )}

          <div className="rv measure">
            <RichText data={post.content} />
          </div>

          {summary.tags.length > 0 && (
            <ul className="chips rv" style={{ marginTop: '2rem' }}>
              {summary.tags.map((t: string) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}

          <p className="rv mt-3">
            <Link className="link-arrow" href="/insights">
              All insights
            </Link>
          </p>
        </div>
      </article>

      <CtaBand
        title="Ready to Understand What Your Data Needs Next?"
        body="A two week Data Health Check gives you a clear view of where your data needs attention, and what to do about it first."
        secondary={{ href: '/contact', label: 'Talk to Our Experts' }}
      />
    </>
  );
}
