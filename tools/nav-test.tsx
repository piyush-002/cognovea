/**
 * Browser test for the reported bug: sections stayed invisible after a
 * client-side route change until a hard refresh.
 *
 * Mounts the REAL <Reveal /> from src/components in a browser, in the same
 * shape the app uses it (rendered once, above content that swaps underneath it,
 * never remounting), then simulates a navigation and asserts the new page's
 * .rv elements get .is-in. Driven by tools/nav-test.mjs.
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as nav from 'next/navigation';

import Reveal from '../src/components/Reveal';

function Page({ id }: { id: string }) {
  return (
    <div>
      {[0, 1, 2, 3].map((i) => (
        <section
          key={i}
          className="rv"
          id={`${id}-${i}`}
          style={{ height: '60vh', border: '1px solid #333', margin: '1rem 0' }}
        >
          {id}-{i}
        </section>
      ))}
    </div>
  );
}

function App() {
  const [route, setRoute] = useState('a');

  return (
    <>
      <button
        id="go"
        onClick={() => {
          // Mirrors what the App Router does: pathname changes, layout stays mounted.
          (nav as unknown as { __setPath: (p: string) => void }).__setPath('/b');
          setRoute('b');
        }}
      >
        navigate
      </button>

      {/* Reveal lives in the layout, rendered once, never remounted. */}
      <Reveal />

      {/* key forces React to discard the old DOM nodes and create new ones,
          without it React reconciles the two pages onto the SAME elements,
          which keep their .is-in class and hide the bug entirely. */}
      {route === 'a' ? <Page key="a" id="a" /> : <Page key="b" id="b" />}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
