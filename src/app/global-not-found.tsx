import { Inter, Sora } from 'next/font/google';
import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import NotFoundBody from '@/components/NotFoundBody';
import './(frontend)/globals.css';

/**
 * The 404 for a URL that matched no route at all.
 *
 * This is `global-not-found`, not `not-found`, and the distinction is the whole
 * reason visitors were seeing the host's default 404 instead of ours:
 *
 *   - `(frontend)/not-found.tsx` is only reached by a `notFound()` call from a
 *     page that already matched inside that group — a playbook slug that no
 *     longer resolves. It never sees an unmatched URL.
 *
 *   - A root `app/not-found.tsx` would handle unmatched URLs, but Next refuses
 *     to compile one unless a root layout wraps it, and this app deliberately
 *     has no single root layout: (frontend) and (payload) each supply their own,
 *     because Payload's admin UI cannot share a document shell with the site.
 *
 * `global-not-found.tsx` exists for precisely that arrangement. Next handles it
 * at the routing level and skips rendering entirely, so no layout is involved
 * and none is required — which is also why this file has to bring its own
 * document, stylesheet and fonts. Introduced in Next 15.4.0 and still flagged
 * experimental, so it is switched on by `experimental.globalNotFound` in
 * next.config.mjs; that flag and this file only work as a pair.
 *
 * The fonts are declared again here rather than imported from the frontend
 * layout because next/font must be called in module scope of the file that uses
 * it. It costs nothing: next/font deduplicates by family and axis at build time,
 * so these resolve to the same two files the rest of the site already serves.
 */
const sora = Sora({ subsets: ['latin'], display: 'swap', variable: '--font-sora' });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata = {
  title: 'Page not found | Cognovea',
  /* Next injects noindex on any 404 by itself; this is here so the intent is
     stated where somebody reads the file. follow matters and is not automatic:
     index would be wrong, but this one URL stands in for every mistyped address
     on the domain, and its links out should still pass. */
  robots: { index: false, follow: true },
};

export const viewport = {
  themeColor: '#0A1024',
  width: 'device-width',
  initialScale: 1,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        {/* globals.css starts .rv elements hidden so they can animate in, and
            nothing here runs Reveal to bring them back. Nav and Footer are
            shared components, so this stays correct if either ever gains a
            revealed element. */}
        <style
          dangerouslySetInnerHTML={{
            __html: '.rv{opacity:1;transform:none;transition:none}',
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Nav />
        <main id="main">
          <NotFoundBody />
        </main>
        <Footer />
      </body>
    </html>
  );
}
