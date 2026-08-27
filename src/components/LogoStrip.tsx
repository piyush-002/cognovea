import type React from 'react';
import Image from 'next/image';

export type StripLogo = {
  id: string;
  name: string;
  website: string | null;
  scale?: number;
  logo: { url: string; alt: string; width?: number; height?: number } | null;
};

/**
 * The client logo band, with no data fetching of its own so it can be rendered
 * by the verification harness at any logo count.
 *
 * The first version centred one logo in a full-height band and it read as a
 * broken page rather than a design. The problem is that a centred row only
 * looks composed once there are five or six items; with one or two it is a
 * small mark adrift in white space, and a young company has one or two.
 *
 * So this is a horizontal band instead: label on the left, logos flowing to the
 * right, hairlines top and bottom. That reads as deliberate at any count,
 * because the label anchors the left edge and the logos are simply what follows
 * it. It also takes about a third of the vertical space.
 */
export default function LogoStrip({ heading, clients }: { heading: string; clients: StripLogo[] }) {
  if (clients.length === 0) return null;

  return (
    <section className="c-logos">
      <div className="wrap c-logos__in">
        <p className="eyebrow c-logos__label">{heading}</p>

        <ul className="c-logos__list">
          {clients.map((c) => {
            if (!c.logo) return null;
            const img = (
              <Image
                src={c.logo.url}
                alt={c.logo.alt || c.name}
                width={c.logo.width ?? 200}
                height={c.logo.height ?? 80}
                sizes="180px"
              />
            );
            return (
              <li
                key={c.id}
                style={c.scale && c.scale !== 1 ? ({ '--logo-scale': c.scale } as React.CSSProperties) : undefined}
              >
                {c.website ? (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" aria-label={c.name}>
                    {img}
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
