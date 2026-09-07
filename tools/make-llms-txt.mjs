/**
 * Generates public/llms.txt from the same data the sitemap uses.
 *
 * Two decisions worth stating, because both had an obvious alternative.
 *
 * WHY A STATIC FILE, NOT A ROUTE HANDLER. A handler at app/llms.txt/route.ts
 * would be the tidier-looking answer, and this project sets `trailingSlash:
 * true` — which means a request for /llms.txt can be redirected to /llms.txt/.
 * Crawlers fetch this at exactly one path and a redirect is a good way to be
 * quietly missed. That failure has already happened once here with robots.txt,
 * and it cost a production 404 that looked correct in source. A file in public/
 * is served at the path it is named, with no routing in front of it.
 *
 * WHY GENERATED, NOT HAND-WRITTEN. Hand-listing pages is what left the
 * playbooks out of the sitemap: it works until somebody publishes the sixth one
 * and forgets. Every URL here is derived, and `--check` fails if the committed
 * file no longer matches its sources, so it cannot rot silently.
 *
 * What it deliberately omits: individual articles and portfolio entries. Those
 * live in Payload, this script has no database, and a build-time snapshot of
 * them would be wrong the first time somebody publishes. The index pages and
 * the sitemap are listed instead, which is where a crawler should look for them.
 *
 *   node tools/make-llms-txt.mjs           # write
 *   node tools/make-llms-txt.mjs --check   # fail if stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require_ = createRequire(import.meta.url);
const ts = require_('typescript');

const FILES = {
  '@/lib/site': 'src/lib/site.ts',
  '@/lib/playbooks': 'src/lib/playbooks/index.ts',
  '@/lib/playbooks/sources': 'src/lib/playbooks/sources.ts',
  '@/lib/services': 'src/lib/services/index.ts',
  './types': 'src/lib/services/types.ts',
  './fractional-data-leadership': 'src/lib/services/fractional-data-leadership.ts',
  './manufacturing': 'src/lib/services/manufacturing.ts',
  './oil-and-gas': 'src/lib/services/oil-and-gas.ts',
  './sap-data-migration': 'src/lib/services/sap-data-migration.ts',
  './scada-data-analytics': 'src/lib/services/scada-data-analytics.ts',
};

// host-redirect is real ESM, so it is imported rather than transpiled.
const hostRedirect = await import(`file://${path.join(root, 'src/lib/host-redirect.mjs')}`);

const cache = { './host-redirect.mjs': hostRedirect, '@/lib/host-redirect.mjs': hostRedirect, '@/lib/schema': {} };
const load = (key) => {
  if (key in cache) return cache[key];
  if (!FILES[key]) return {};
  const out = ts.transpileModule(fs.readFileSync(path.join(root, FILES[key]), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: FILES[key],
  }).outputText;
  const m = { exports: {} };
  cache[key] = m.exports;
  new Function('exports', 'require', 'module', out)(m.exports, load, m);
  return (cache[key] = m.exports);
};

const { site, abs, serviceLinks, industryLinks, routes } = load('@/lib/site');
const { publishedPlaybooks } = load('@/lib/playbooks');
const { SERVICES } = load('@/lib/services');

/** A link line in the format the llms.txt convention uses.
 *
 * abs() appends a trailing slash, which is correct for every page on this site
 * (trailingSlash is on) and wrong for the two actual files at the end — nothing
 * fetches /sitemap.xml/. Anything with an extension is left alone. */
const url = (href) => (/\.[a-z0-9]+$/i.test(href) ? `${site.url}${href}` : abs(href));
const line = (label, href, note) => `- [${label}](${url(href)})${note ? `: ${note}` : ''}`;

/** Trims a sentence to something that reads as a description rather than a page. */
const short = (s, max = 160) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

const byPath = Object.fromEntries(routes.map((r) => [r.path, r]));
const has = (p) => Boolean(byPath[p]);

const serviceNote = (href) => {
  const slug = href.replace(/^\//, '');
  const s = SERVICES.find((x) => x.slug === slug);
  return s ? short(s.description) : null;
};

const sections = [];

sections.push(`# ${site.name}`, '', `> ${site.tagline}`, '', short(site.description, 400), '');

sections.push(
  '## Services',
  '',
  ...serviceLinks.map((l) => line(l.label, l.href, serviceNote(l.href) ?? l.blurb)),
  '',
);

if (industryLinks?.length) {
  sections.push(
    '## Industries',
    '',
    ...industryLinks.map((l) => line(l.label, l.href, serviceNote(l.href) ?? l.blurb)),
    '',
  );
}

const playbooks = publishedPlaybooks();
if (playbooks.length) {
  sections.push(
    '## Industry playbooks',
    '',
    'Use cases by sector, each with the data it needs, how you would know it worked, and where it fails.',
    '',
    line('All playbooks', '/playbooks'),
    ...playbooks.map((p) => line(p.title, `/playbooks/${p.slug}`, short(p.standfirst))),
    '',
  );
}

sections.push(
  '## Tools and evidence',
  '',
  ...[
    has('/data-health-check') && line('Data Health Check', '/data-health-check', 'A two week AI and data readiness assessment ending in a written finding.'),
    has('/tools/bi-automation-calculator') && line('BI Automation Calculator', '/tools/bi-automation-calculator', 'Estimates what manual reporting costs a business each year.'),
    has('/portfolio') && line('Portfolio and case studies', '/portfolio'),
    has('/insights') && line('Insights', '/insights'),
  ].filter(Boolean),
  '',
);

sections.push(
  '## Company',
  '',
  ...[
    has('/about-us') && line('About Cognovea', '/about-us'),
    has('/careers') && line('Careers', '/careers'),
    has('/contact') && line('Contact', '/contact', `${site.email}`),
    has('/privacy-policy') && line('Privacy policy', '/privacy-policy'),
  ].filter(Boolean),
  '',
);

sections.push(
  '## Optional',
  '',
  /* "Optional" is the convention's own heading for material a crawler may skip
     when it is short of context. The full URL list belongs here rather than in
     the body: it is the completionist path, not the useful summary. */
  line('Sitemap', '/sitemap.xml'),
  line('Robots', '/robots.txt'),
  '',
);

const content = `${sections.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;

/* Guard, because the first run of this script emitted "undefined/..." for every
   URL: site.url comes from an .mjs module reached through the shim above, and a
   missed specifier resolves to undefined rather than throwing. A file full of
   undefined links would have looked plausible in a diff. */
if (!site.url || content.includes('undefined/') || !content.includes('https://')) {
  console.error('FAIL  site.url did not resolve; refusing to write. Got:', site.url);
  process.exit(1);
}
const out = path.join(root, 'public/llms.txt');

if (process.argv.includes('--check')) {
  const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (current !== content) {
    console.error('FAIL  public/llms.txt is stale. Run: node tools/make-llms-txt.mjs');
    process.exit(1);
  }
  console.log(`  ok    public/llms.txt matches its sources (${content.split('\n').length} lines)`);
  process.exit(0);
}

fs.writeFileSync(out, content);
console.log(`  wrote public/llms.txt — ${content.split('\n').length} lines, ${(content.length / 1024).toFixed(1)}KB`);
