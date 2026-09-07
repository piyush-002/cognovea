/**
 * Keeps the service pages honest about the things that fail silently.
 *
 * These pages are data plus a shared template, which removes a whole class of
 * drift and introduces a different one: nothing in a data file tells you that
 * the image it names does not exist, that the route was never added to the
 * sitemap, or that a "related" link points at a page nobody built. Each of those
 * renders perfectly and is wrong.
 *
 *   node tools/check-services.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require_ = createRequire(import.meta.url);

let ts;
try {
  ts = require_('typescript');
} catch {
  console.log('SKIP  typescript is not installed here. Run `npm install` first.');
  process.exit(0);
}

const FILES = {
  '@/lib/services': 'src/lib/services/index.ts',
  './types': 'src/lib/services/types.ts',
  './fractional-data-leadership': 'src/lib/services/fractional-data-leadership.ts',
  './manufacturing': 'src/lib/services/manufacturing.ts',
  './oil-and-gas': 'src/lib/services/oil-and-gas.ts',
  './sap-data-migration': 'src/lib/services/sap-data-migration.ts',
  './scada-data-analytics': 'src/lib/services/scada-data-analytics.ts',
  '@/lib/schema': 'src/lib/schema.ts',
};

const cache = {};
const load = (key) => {
  if (key in cache) return cache[key];
  if (!FILES[key]) return {};
  const src = ts.transpileModule(fs.readFileSync(path.join(root, FILES[key]), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: FILES[key],
  }).outputText;
  const m = { exports: {} };
  cache[key] = m.exports;
  new Function('exports', 'require', 'module', src)(m.exports, load, m);
  return (cache[key] = m.exports);
};

const { SERVICES } = load('@/lib/services');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`); }
};

const siteSrc = fs.readFileSync(path.join(root, 'src/lib/site.ts'), 'utf8');

/* --- routes that actually exist -------------------------------------------- */
const existingRoutes = new Set(
  fs
    .readdirSync(path.join(root, 'src/app/(frontend)'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `/${d.name}`),
);

ok('there is at least one service page', SERVICES.length > 0);

const slugs = SERVICES.map((s) => s.slug);
ok('slugs are unique', new Set(slugs).size === slugs.length, slugs.join(', '));

for (const s of SERVICES) {
  /* The page file. Data with no route is invisible; a route with no data cannot
     compile, so only this direction needs checking. */
  ok(
    `${s.slug}: has a page.tsx`,
    fs.existsSync(path.join(root, 'src/app/(frontend)', s.slug, 'page.tsx')),
    `expected src/app/(frontend)/${s.slug}/page.tsx`,
  );

  /* Missing from routes[] means missing from the sitemap, which means written
     and never submitted — the exact failure that hid the playbooks. */
  ok(`${s.slug}: is listed in site.ts routes`, siteSrc.includes(`path: '/${s.slug}'`));

  ok(
    `${s.slug}: its illustration exists`,
    fs.existsSync(path.join(root, 'public', s.image.src)),
    s.image.src,
  );
  ok(`${s.slug}: the illustration is described`, (s.image.alt || '').length > 25);

  // 62 is what a search result shows before it truncates.
  ok(`${s.slug}: title fits a search result`, s.title.length <= 62, `${s.title.length}: "${s.title}"`);
  ok(
    `${s.slug}: description is a usable length`,
    s.description.length >= 80 && s.description.length <= 175,
    `${s.description.length} chars`,
  );

  ok(`${s.slug}: has an h1 distinct from the title`, s.h1 !== s.title && s.h1.length > 15);
  ok(`${s.slug}: has at least four sections`, s.sections.length >= 4, String(s.sections.length));
  ok(`${s.slug}: has an FAQ worth marking up`, s.faq.length >= 4, String(s.faq.length));

  for (const r of s.related) {
    ok(
      `${s.slug}: related link ${r.href} goes somewhere real`,
      existingRoutes.has(r.href) || r.href.startsWith('/playbooks/') || r.href.startsWith('/tools/'),
      `no route for ${r.href}`,
    );
  }

  /* Standing rule on this project: pricing, data residency, IP and security
     certification go through Piyush before they go on a page. A figure in
     rupees or dollars is the one that gets added in a hurry and then quoted
     back by a prospect six months later. */
  const prose = JSON.stringify(s);
  const money = prose.match(/(?:₹|\$|INR|USD)\s?\d|lakh|\bcrore\b/gi) || [];
  ok(`${s.slug}: names no price`, money.length === 0, money.join(', '));
}

/* --- the nav has to be able to reach them ---------------------------------- */
{
  const reachable = SERVICES.filter((s) => siteSrc.includes(`href: '/${s.slug}'`));
  ok(
    'every service page is linked from the header',
    reachable.length === SERVICES.length,
    `not in serviceLinks or industryLinks: ${SERVICES.filter((s) => !reachable.includes(s)).map((s) => s.slug).join(', ')}`,
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
