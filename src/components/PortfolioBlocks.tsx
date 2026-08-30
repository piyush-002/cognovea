import Image from 'next/image';
import RichText from '@/components/RichText';
import { toSameOriginPath } from '@/lib/media-url';

/**
 * Renders the body of a portfolio entry.
 *
 * Every block is guarded. An editor can save a gallery with one image still
 * uploading, a feature grid whose rows are half filled, or an image block whose
 * upload was later deleted — and a page that throws on any of those is a page
 * that goes blank in production because somebody was mid-edit. So each block
 * checks what it needs and renders nothing rather than crashing.
 *
 * `depth: 2` on the query is what makes uploads inside blocks come back as
 * objects rather than ids. Without it every image here is a number and the
 * whole body renders empty, which is the failure this file is most likely to
 * meet again.
 */

type Media = { url?: string | null; alt?: string | null; width?: number | null; height?: number | null };

/** An upload field is a Media object at depth 2, and an id if the depth was too shallow. */
function media(value: unknown): Media | null {
  if (!value || typeof value !== 'object') return null;
  const m = value as Media;
  return m.url ? m : null;
}

function Figure({ value, caption, sizes }: { value: unknown; caption?: string | null; sizes: string }) {
  const m = media(value);
  if (!m?.url) return null;
  return (
    <figure className="pf__fig">
      <Image
        src={toSameOriginPath(m.url)}
        alt={m.alt || ''}
        width={m.width || 1600}
        height={m.height || 900}
        sizes={sizes}
        loading="lazy"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function Head({ eyebrow, heading }: { eyebrow?: string | null; heading?: string | null }) {
  if (!eyebrow && !heading) return null;
  return (
    <header className="pf__head">
      {eyebrow ? <span className="pf__eyebrow">{eyebrow}</span> : null}
      {heading ? <h2>{heading}</h2> : null}
    </header>
  );
}

type Block = Record<string, unknown> & { blockType?: string; id?: string };

export default function PortfolioBlocks({ body }: { body: unknown }) {
  if (!Array.isArray(body)) return null;

  return (
    <>
      {(body as Block[]).map((block, i) => {
        const key = String(block.id ?? i);

        switch (block.blockType) {
          case 'prose':
            return (
              <section key={key} className="pf__block pf__prose">
                <Head eyebrow={block.eyebrow as string} heading={block.heading as string} />
                <RichText data={block.text} />
              </section>
            );

          case 'featureGrid': {
            const items = Array.isArray(block.items) ? (block.items as Record<string, string>[]) : [];
            const shown = items.filter((it) => it?.title);
            if (!shown.length) return null;
            return (
              <section key={key} className="pf__block">
                <Head eyebrow={block.eyebrow as string} heading={block.heading as string} />
                <ul className={`pf__grid pf__grid--${block.columns === '2' ? '2' : '3'}`}>
                  {shown.map((it, k) => (
                    <li key={k}>
                      <h3>{it.title}</h3>
                      {it.body ? <p>{it.body}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }

          case 'steps': {
            const items = Array.isArray(block.items) ? (block.items as Record<string, string>[]) : [];
            const shown = items.filter((it) => it?.label);
            if (!shown.length) return null;
            return (
              <section key={key} className="pf__block">
                <Head eyebrow={block.eyebrow as string} heading={block.heading as string} />
                {block.intro ? <p className="pf__lead">{block.intro as string}</p> : null}
                <ol className="pf__steps">
                  {shown.map((it, k) => (
                    <li key={k}>
                      <span className="pf__step-n">{String(k + 1).padStart(2, '0')}</span>
                      <span className="pf__step-l">{it.label}</span>
                      {it.detail ? <span className="pf__step-d">{it.detail}</span> : null}
                    </li>
                  ))}
                </ol>
                {block.note ? <p className="pf__note">{block.note as string}</p> : null}
              </section>
            );
          }

          case 'flow': {
            const stages = Array.isArray(block.stages) ? (block.stages as Record<string, string>[]) : [];
            const shown = stages.filter((st) => st?.label);
            if (!shown.length) return null;
            return (
              <section key={key} className="pf__block">
                <Head eyebrow={block.eyebrow as string} heading={block.heading as string} />
                {block.intro ? <p className="pf__lead">{block.intro as string}</p> : null}
                {/* A list, not a picture. It wraps on a phone, it is readable by
                    a screen reader in order, and the arrows are decorative. */}
                <ol className="pf__flow">
                  {shown.map((st, k) => (
                    <li key={k}>
                      <span>{st.label}</span>
                      {k < shown.length - 1 ? (
                        <span className="pf__flow-arrow" aria-hidden="true">
                          →
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            );
          }

          case 'imageFull':
            return (
              <div key={key} className={`pf__block${block.wide ? ' pf__block--wide' : ''}`}>
                <Figure
                  value={block.image}
                  caption={block.caption as string}
                  sizes={block.wide ? '(min-width: 1100px) 1040px, 94vw' : '(min-width: 900px) 46rem, 94vw'}
                />
              </div>
            );

          case 'imagePair':
            return (
              <div key={key} className="pf__block pf__pair">
                <Figure value={block.left} sizes="(min-width: 900px) 22rem, 46vw" />
                <Figure value={block.right} sizes="(min-width: 900px) 22rem, 46vw" />
                {block.caption ? <p className="pf__cap">{block.caption as string}</p> : null}
              </div>
            );

          case 'gallery': {
            const items = Array.isArray(block.items) ? (block.items as Record<string, unknown>[]) : [];
            const shown = items.filter((it) => media(it?.image));
            if (!shown.length) return null;
            return (
              <div key={key} className={`pf__block pf__gal pf__gal--${block.columns === '3' ? '3' : '2'}`}>
                {shown.map((it, k) => (
                  <Figure
                    key={k}
                    value={it.image}
                    caption={it.caption as string}
                    sizes="(min-width: 900px) 22rem, 46vw"
                  />
                ))}
              </div>
            );
          }

          case 'quote':
            if (!block.quote) return null;
            return (
              <figure key={key} className="pf__block pf__quote">
                <blockquote>{block.quote as string}</blockquote>
                {block.attribution ? (
                  <figcaption>
                    {block.attribution as string}
                    {block.role ? <span>{block.role as string}</span> : null}
                  </figcaption>
                ) : null}
              </figure>
            );

          default:
            // A block type added to the collection and not yet handled here.
            // Rendering nothing is right: the alternative is a crash on a page
            // an editor has already published.
            return null;
        }
      })}
    </>
  );
}
