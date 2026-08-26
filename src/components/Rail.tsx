'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type RailItem = {
  id: string;
  label: string;
  content: ReactNode;
};

/**
 * A sticky side rail that highlights the section currently in view and scrolls
 * to it on click — used for the multi-phase process sections, which are long
 * and otherwise hard to navigate.
 *
 * On narrow screens the rail is hidden by CSS and the panels simply stack.
 */
export default function Rail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panels = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (panels.length === 0 || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the top of the viewport among those visible.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: 0 },
    );

    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [items]);

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="rail" ref={wrapRef}>
      <nav className="rail__nav" aria-label="Section navigation">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`rail__link${active === it.id ? ' is-active' : ''}`}
            aria-current={active === it.id ? 'true' : undefined}
            onClick={() => go(it.id)}
          >
            {it.label}
          </button>
        ))}
      </nav>

      <div className="rail__panels">
        {items.map((it) => (
          <section className="rail__panel rv" id={it.id} key={it.id}>
            {it.content}
          </section>
        ))}
      </div>
    </div>
  );
}
