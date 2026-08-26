'use client';

import { useId, useState, type ReactNode } from 'react';

export type Tab = {
  key: string;
  label: string;
  content: ReactNode;
};

/**
 * Keyboard-navigable tab set (ArrowLeft/ArrowRight/Home/End), used to make the
 * long service-capability sections browsable instead of an endless scroll.
 */
export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const uid = useId().replace(/:/g, '');

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const last = tabs.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    if (e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    document.getElementById(`${uid}-t-${next}`)?.focus();
  }

  return (
    <div>
      <div className="tabs__list" role="tablist" aria-label="Capabilities" onKeyDown={onKeyDown}>
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`${uid}-t-${i}`}
            className="tabs__btn"
            aria-selected={active === i}
            aria-controls={`${uid}-p-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Every panel is rendered and inactive ones are `hidden`, rather than
          mounting only the active one. Tab copy is real page content — if it
          only enters the DOM on click, crawlers never see it and neither does
          in-page browser search. */}
      {tabs.map((tab, i) => (
        <div
          key={tab.key}
          className="tabs__panel"
          role="tabpanel"
          id={`${uid}-p-${i}`}
          aria-labelledby={`${uid}-t-${i}`}
          tabIndex={0}
          hidden={active !== i}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
