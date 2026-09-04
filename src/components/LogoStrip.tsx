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

/**
 * Below this, the strip stays a static row.
 *
 * The same reasoning as the original centred layout: a marquee is a solution to
 * having more logos than fit, and running one over three logos advertises that
 * there are only three. It also loops visibly often, which draws the eye to the
 * repetition rather than to the clients.
 */
const MARQUEE_MIN = 6;

/** Roughly constant travel speed per logo, so six do not race and twenty do not crawl. */
const SECONDS_PER_LOGO = 5;

function Item({ client }: { client: StripLogo }) {
  if (!client.logo) return null;
  return (
    <Image
      src={client.logo.url}
      alt={client.logo.alt || client.name}
      width={client.logo.width ?? 200}
      height={client.logo.height ?? 80}
      sizes="180px"
    />
  );
}

function List({
  clients,
  clone = false,
}: {
  clients: StripLogo[];
  /** The second copy that makes the loop seamless. It is duplicate content and
      duplicate links, so it is hidden from assistive tech and from the tab
      order, and its logos are not anchors at all. */
  clone?: boolean;
}) {
  return (
    <ul className="c-logos__list" aria-hidden={clone || undefined}>
      {clients.map((c) => {
        if (!c.logo) return null;
        const img = <Item client={c} />;
        return (
          <li
            key={c.id}
            style={c.scale && c.scale !== 1 ? ({ '--logo-scale': c.scale } as React.CSSProperties) : undefined}
          >
            {c.website && !clone ? (
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
  );
}

export default function LogoStrip({ heading, clients }: { heading: string; clients: StripLogo[] }) {
  if (clients.length === 0) return null;

  const withLogos = clients.filter((c) => c.logo);
  const marquee = withLogos.length >= MARQUEE_MIN;

  return (
    <section className="c-logos">
      <div className="wrap c-logos__in">
        <p className="eyebrow c-logos__label">{heading}</p>

        {marquee ? (
          <div className="c-logos__marquee">
            <div
              className="c-logos__track"
              style={{ '--logo-duration': `${withLogos.length * SECONDS_PER_LOGO}s` } as React.CSSProperties}
            >
              <List clients={clients} />
              <List clients={clients} clone />
            </div>
          </div>
        ) : (
          <List clients={clients} />
        )}
      </div>
    </section>
  );
}
