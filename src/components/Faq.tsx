'use client';

import { useId, useState } from 'react';
import type { FaqItem } from '@/lib/schema';

/**
 * Accessible accordion.
 *
 * The FAQPage JSON-LD is built by faqSchema() in @/lib/schema from the same
 * items array a page passes here. That builder deliberately does NOT live in
 * this file: this is a Client Component, and a Server Component cannot call a
 * function exported across the client boundary.
 */
export default function Faq({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const uid = useId().replace(/:/g, '');

  return (
    <div className="acc">
      {items.map((item, i) => {
        const isOpen = open === i;
        const paras = Array.isArray(item.a) ? item.a : [item.a];
        return (
          <div className={`acc__item${isOpen ? ' is-open' : ''}`} key={item.q}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                className="acc__btn"
                aria-expanded={isOpen}
                aria-controls={`${uid}-p-${i}`}
                id={`${uid}-b-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="acc__ico" aria-hidden="true" />
              </button>
            </h3>
            <div className="acc__panel" id={`${uid}-p-${i}`} role="region" aria-labelledby={`${uid}-b-${i}`}>
              <div>
                {paras.map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
