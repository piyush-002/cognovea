'use client';

import { useEffect } from 'react';

/**
 * Opens the print dialog once the page has painted.
 *
 * A frame is waited for rather than firing on mount: printing before layout
 * settles produces a document with the bars at zero width, which is a
 * convincing-looking wrong answer rather than an obvious failure.
 *
 * Nothing happens if printing is refused or cancelled — the page stays on
 * screen and readable, which is a reasonable outcome in itself.
 *
 * `enabled` is false when the link carried no figures. Throwing up a print
 * dialog over an apology is the wrong reflex, and there would be nothing worth
 * printing behind it.
 */
export default function PrintTrigger({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const id = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        try {
          window.print();
        } catch {
          // Some embedded browsers refuse. The page is still there to read.
        }
      }, 350);
    });
    return () => window.cancelAnimationFrame(id);
  }, [enabled]);

  return null;
}
