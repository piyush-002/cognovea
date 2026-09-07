import Image from 'next/image';
import type { Testimonial } from '@/lib/content';

/**
 * A client quote, with no data fetching, so the harness can render it.
 *
 * Set on a card rather than floating on the band background: a quote with no
 * container has nothing holding it, and at large type on a pale band it reads
 * as a stray heading. The card gives it an edge, and the oversized quote mark
 * behind the text says "this is someone else speaking" before a word is read.
 */

/**
 * Just the quote, without a band around it.
 *
 * Split out from QuoteCard so the carousel can put several of these in one
 * band. QuoteCard owns the band; this owns the quote.
 */
export function QuoteFigure({
  t,
  reveal = true,
}: {
  t: Testimonial;
  /**
   * Scroll-reveal, which is right for a quote sitting in the page and wrong for
   * one inside a horizontal scroller. Reveal is driven by an IntersectionObserver
   * against the viewport, and cards waiting to the right of the track are outside
   * it — so they would sit at opacity 0 until scrolled to, and a fast drag would
   * show blank cards catching up. In the carousel they are simply visible.
   */
  reveal?: boolean;
}) {
  return (
    <figure className={reveal ? 'quote rv' : 'quote'}>
      <blockquote className="quote__text">{t.quote}</blockquote>

      <figcaption className="quote__by">
        {t.photo?.url ? (
          <Image
            className="quote__photo"
            src={t.photo.url}
            alt={t.photo.alt || t.authorName}
            width={48}
            height={48}
          />
        ) : (
          // An initial rather than a stock silhouette. A generic avatar
          // suggests a person we could not be bothered to photograph.
          <span className="quote__initial" aria-hidden="true">
            {t.authorName.trim().charAt(0)}
          </span>
        )}

        <span className="quote__who">
          <strong>{t.authorName}</strong>
          {(t.authorRole || t.companyName) && (
            <span className="quote__role">{[t.authorRole, t.companyName].filter(Boolean).join(', ')}</span>
          )}
        </span>

        {t.clientLogo?.url && (
          <Image
            className="quote__logo"
            src={t.clientLogo.url}
            alt={t.companyName ?? ''}
            width={120}
            height={40}
          />
        )}
      </figcaption>
    </figure>
  );
}

export default function QuoteCard({ t, tone }: { t: Testimonial; tone: 'light' | 'dark' }) {
  // Light tone is a plain white band. Sitting on the tint stacked another grey
  // against the logo strip above and the People band below.
  return (
    <section className={tone === 'dark' ? 'band band--dark' : 'band'}>
      <div className="wrap">
        <QuoteFigure t={t} />
      </div>
    </section>
  );
}
