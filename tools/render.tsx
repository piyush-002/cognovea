/**
 * Verification harness, NOT part of the Next.js build.
 *
 * npm/registry access is blocked in this environment, so `next build` can't run
 * here. This renders the real page components with react-dom/server against
 * lightweight stubs for next/link and next/navigation, which proves the JSX,
 * imports, props and component wiring are all valid, and produces static HTML
 * previews that can be screenshotted.
 *
 * Delete this folder if you don't want it in the repo; it is excluded from
 * tsconfig.json and has no effect on `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Footer from '../src/components/Footer';
import Nav from '../src/components/Nav';

import About from '../src/app/(frontend)/about-us/page';
import AiStrategy from '../src/app/(frontend)/ai-strategy-consulting/page';
import Careers from '../src/app/(frontend)/careers/page';
import Contact from '../src/app/(frontend)/contact/page';
import DataEngineering from '../src/app/(frontend)/data-engineering-services/page';
import DataHealthCheck from '../src/app/(frontend)/data-health-check/page';
import DataModernization from '../src/app/(frontend)/data-modernization-services/page';
import GenerativeAi from '../src/app/(frontend)/generative-ai-services/page';
import Home from '../src/app/(frontend)/page';
import Insights from '../src/app/(frontend)/insights/page';
import NotFound from '../src/app/(frontend)/not-found';
import Privacy from '../src/app/(frontend)/privacy-policy/page';
import ConsentBanner from '../src/components/ConsentBanner';
import LogoStrip from '../src/components/LogoStrip';
import QuoteCard from '../src/components/QuoteCard';

// The bundle runs from the project root (see tools/build-preview.mjs).
const root = process.cwd();
const here = path.join(root, 'tools');
const outDir = path.join(root, '..', 'preview');

// Some pages are async Server Components now (they await content queries), so
// the list is typed loosely and each page is awaited below.
/* Stand-ins, never shipped. Site artwork is the wrong shape for a logo but the
   right shape for judging how a row of them sits. */
const ART = [
  '/img/art-clarity.svg',
  '/img/de-checks.svg',
  '/img/dm-cost.svg',
  '/img/ai-rag.svg',
  '/img/as-roadmap.svg',
  '/img/cr-funnel.svg',
  '/img/ct-locations.svg',
];

/* Deliberately awkward logo shapes, as data URIs so no files are shipped.
   Real client artwork is never consistent: some marks are ten times wider than
   tall, some are square, and some arrive with most of the canvas transparent. */
const svg = (body: string, w: number, h: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`,
  )}`;

const SHAPES = [
  { id: 'wide', name: 'Very wide 10:1', url: svg('<rect x="0" y="18" width="600" height="24" fill="%23333"/>', 600, 60), w: 600, h: 60 },
  { id: 'normal', name: 'Typical 3:1', url: svg('<rect x="0" y="20" width="300" height="60" fill="%23333"/>', 300, 100), w: 300, h: 100 },
  { id: 'square', name: 'Square 1:1', url: svg('<circle cx="50" cy="50" r="46" fill="%23333"/>', 100, 100), w: 100, h: 100 },
  { id: 'padded', name: 'Square, 70% padding', url: svg('<circle cx="100" cy="100" r="30" fill="%23333"/>', 200, 200), w: 200, h: 200 },
];

const shapeLogos = SHAPES.map((s) => ({
  id: s.id,
  name: s.name,
  website: null,
  scale: 1,
  logo: { url: s.url, alt: s.name, width: s.w, height: s.h },
}));

const fakeLogos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    name: `Client ${i + 1}`,
    website: i % 2 === 0 ? 'https://example.com' : null,
    scale: 1,
    logo: { url: ART[i % ART.length], alt: `Client ${i + 1}`, width: 200, height: 80 },
  }));

const fakeQuote = {
  id: '1',
  quote:
    'We could not agree on a revenue number across three teams. Cognovea found the four places the definitions diverged and rebuilt the pipeline around one of them. Month-end went from a week of reconciliation to an afternoon.',
  authorName: 'Priya Raman',
  authorRole: 'Head of Data',
  companyName: 'Northwind Logistics',
  photo: null,
  clientLogo: { url: ART[1], alt: 'Northwind Logistics' },
};

const PAGES: [string, any][] = [
  ['index', Home],
  ['data-engineering-services', DataEngineering],
  ['data-modernization-services', DataModernization],
  ['generative-ai-services', GenerativeAi],
  ['ai-strategy-consulting', AiStrategy],
  ['data-health-check', DataHealthCheck],
  ['about-us', About],
  ['careers', Careers],
  ['contact', Contact],
  ['privacy-policy', Privacy],
  ['insights', Insights],
  ['404', NotFound],
  // Fixture, not a route. The consent banner only mounts client-side, behind a
  // configured measurement ID and an undecided visitor, so nothing in tools/
  // could see it. Rendering it here puts it in front of the same contrast and
  // accessibility checks as everything else.
  ['consent-banner', () => React.createElement(ConsentBanner, { onAccept: () => {}, onDecline: () => {} })],

  /* Logo and quote fixtures. These sections only render once real records exist
     in the database, so nothing here could see them, and the first version
     shipped with one logo centred in a tall empty band. Rendering them at the
     counts a young company actually has (one, three, seven) is the only way to
     judge whether the composition holds. The images are site artwork standing
     in for client marks, which is enough to judge sizing and rhythm. */
  ['logos-1', () => React.createElement(LogoStrip, { heading: 'Teams we work with', clients: fakeLogos(1) })],
  ['logos-3', () => React.createElement(LogoStrip, { heading: 'Teams we work with', clients: fakeLogos(3) })],
  ['logos-7', () => React.createElement(LogoStrip, { heading: 'Who we work with', clients: fakeLogos(7) })],
  ['quote', () => React.createElement(QuoteCard, { t: fakeQuote, tone: 'light' })],
  ['quote-dark', () => React.createElement(QuoteCard, { t: fakeQuote, tone: 'dark' })],

  /* The homepage sequence, which is what actually has to look right: a white
     section, then the logo strip, then the quote, then the tinted People band.
     Judging the strip on its own is how it ended up as the third grey in a row. */
  ['logos-shapes', () => React.createElement(LogoStrip, { heading: 'Shape stress test', clients: shapeLogos })],
  ['logos-context', () =>
    React.createElement(React.Fragment, null,
      React.createElement('section', { className: 'band' },
        React.createElement('div', { className: 'wrap' },
          React.createElement('p', { className: 'eyebrow' }, 'Proof'),
          React.createElement('h2', { className: 'h-lg' }, 'The section above the strip'))),
      React.createElement(LogoStrip, { heading: 'Teams we work with', clients: fakeLogos(5) }),
      React.createElement(QuoteCard, { t: fakeQuote, tone: 'light' }),
      React.createElement('section', { className: 'band band--tint' },
        React.createElement('div', { className: 'wrap' },
          React.createElement('p', { className: 'eyebrow' }, 'People'),
          React.createElement('h2', { className: 'h-lg' }, 'The tinted band below'))))],
];

function shell(body: string, title: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Cognovea preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400..700&family=Inter:wght@400..600&display=swap" rel="stylesheet">
<style>
  /* The app supplies these through next/font. The harness has no bundler step,
     so it maps the same variables onto the webfont families directly.

     Note: in a sandbox with no egress to fonts.googleapis.com the stylesheet
     above simply fails and everything measures with fallback metrics instead.
     That is survivable, but it means heights measured here are approximate, and
     the audit prints a warning when it detects it. Do not treat a height
     assertion from this harness as exact production geometry. */
  :root { --font-sora: 'Sora'; --font-inter: 'Inter'; }
</style>
<link rel="stylesheet" href="./globals.css">
<style>
  /* Preview only. The real app hides .rv until Reveal.tsx observes it into view;
     this static render has no React, so nothing would ever reveal. */
  .rv { opacity: 1; transform: none; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(
  path.join(here, '..', 'src', 'app', '(frontend)', 'globals.css'),
  path.join(outDir, 'globals.css'),
);

// Mirror public/ so absolute asset paths like /img/art-clarity.svg resolve when
// the preview is served over http (see tools/shots.mjs).
const pub = path.join(root, 'public');
if (fs.existsSync(pub)) fs.cpSync(pub, outDir, { recursive: true });

async function main() {
  let failures = 0;
  for (const [name, Page] of PAGES) {
    try {
      // An async Server Component cannot be rendered by renderToStaticMarkup
      // directly, calling it returns a promise, not an element. So call it,
      // await the result, and render the resolved tree.
      const produced = Page.constructor.name === 'AsyncFunction'
        ? await Page({ params: Promise.resolve({}), searchParams: Promise.resolve({}) })
        : React.createElement(Page);

      const body = renderToStaticMarkup(
        React.createElement(React.Fragment, null,
          React.createElement(Nav),
          React.createElement('main', { id: 'main' }, produced),
          React.createElement(Footer),
        ),
      );
      fs.writeFileSync(path.join(outDir, `${name}.html`), shell(body, name));
      console.log(`ok    ${name}  (${(body.length / 1024).toFixed(1)} kB)`);
    } catch (err) {
      failures++;
      console.error(`FAIL  ${name}\n      ${(err as Error).message}`);
    }
  }

  console.log(failures === 0 ? '\nAll pages rendered.' : `\n${failures} page(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

// Wrapped in a function rather than using top-level await: the harness is
// bundled to CJS, which has no top-level await.
main();
