/**
 * Checks the structured data the pages actually emit.
 *
 * Two failure modes worth guarding. A placeholder that ships: a `sameAs`
 * pointing at a handle nobody registered, or a logo URL with a token still in
 * it, is a worse signal than omitting the field. And a duplicated entity: two
 * Organization blocks describing the same company with different fields is how
 * a knowledge panel ends up split between two half-populated records.
 *
 *   node tools/test-jsonld.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const pagesDir = path.join(root, 'src/app/(frontend)');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? '\n        ' + detail : ''}`);
  }
};

const read = (rel) => fs.readFileSync(path.join(pagesDir, rel), 'utf8');
const layout = read('layout.tsx');

/* --- no placeholders anywhere --------------------------------------------- */
const sources = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(e.name)) sources.push(full);
  }
};
walk(path.join(root, 'src'));

const placeholderHits = [];
for (const f of sources) {
  const text = fs.readFileSync(f, 'utf8');
  let inBlockComment = false;
  text.split('\n').forEach((line, i) => {
    // Comments explain things; they are not emitted. A doc comment that says
    // "example.com" to illustrate a rule is not a placeholder that ships.
    const trimmed = line.trim();
    if (trimmed.startsWith('/*')) inBlockComment = !trimmed.includes('*/');
    else if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (inBlockComment || trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    if (/<<[^>]+>>|YOUR[_-]?HANDLE|PATH-TO-LOGO|example\.com/.test(line)) {
      placeholderHits.push(`${path.relative(root, f)}:${i + 1}`);
    }
  });
}
ok('no unfilled placeholder ships in any schema', placeholderHits.length === 0, placeholderHits.join(', '));

/* --- Organization --------------------------------------------------------- */
ok('the Organization declares a logo', /logo:\s*\{/.test(layout));
ok('the logo is the logo file, not the social card', /abs\('\/logo\.png'\)/.test(layout));
ok('a logo file exists to point at', fs.existsSync(path.join(root, 'public/logo.png')));

// Google asks for at least 112x112; smaller is ignored.
if (fs.existsSync(path.join(root, 'public/logo.png'))) {
  const buf = fs.readFileSync(path.join(root, 'public/logo.png'));
  // PNG header: width and height are big-endian 32-bit at offsets 16 and 20.
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  ok(`the logo is large enough (${width}x${height})`, width >= 112 && height >= 112);
  ok('the declared dimensions match the file', new RegExp(`width: ${width}`).test(layout) && new RegExp(`height: ${height}`).test(layout), `file is ${width}x${height}`);
}

/* --- sameAs must never carry an empty or invented profile ----------------- */
const siteTs = fs.readFileSync(path.join(root, 'src/lib/site.ts'), 'utf8');
const socialBlock = siteTs.match(/social:\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const declared = [...socialBlock.matchAll(/'([^']*)'/g)].map((m) => m[1]);
const filled = declared.filter((v) => v.trim().length > 0);

ok('sameAs is built from site.social, not hardcoded', /sameAs: socialProfiles/.test(layout));
ok('sameAs is omitted entirely while no profile is set', /socialProfiles\.length > 0/.test(layout));
ok(
  'every social value is either empty or a real absolute URL',
  filled.every((v) => /^https:\/\/[^\s]+\.[^\s]+/.test(v)),
  `bad: ${filled.filter((v) => !/^https:\/\//.test(v)).join(', ')}`,
);
console.log(`        (${filled.length} of ${declared.length} social profiles filled in)`);

/* --- one Organization entity, referenced not repeated --------------------- */
/**
 * Inline is correct in exactly three positions. Google's Article and
 * JobPosting documentation expects author, publisher and hiringOrganization
 * to carry their own name and logo rather than an @id it would have to
 * resolve. Everywhere else an @id reference keeps one entity instead of
 * several partial ones.
 */
const INLINE_OK = /(author|publisher|hiringOrganization)\s*:/;
const unexpected = [];
for (const f of sources) {
  const rel = path.relative(root, f);
  // The root layout is where the entity is defined.
  if (rel === 'src/app/(frontend)/layout.tsx') continue;

  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!/'@type':\s*'Organization'/.test(line)) return;
    // The key may sit on the same line as the @type, or on the line above it
    // when the object is spread over several.
    const opener = `${lines[i - 1] ?? ''}\n${line}`;
    if (INLINE_OK.test(opener)) return;
    unexpected.push(`${rel}:${i + 1}`);
  });
}
ok(
  'no page declares a second Organization instead of referencing the first',
  unexpected.length === 0,
  unexpected.join(', '),
);

/* --- every inner page carries a breadcrumb -------------------------------- */
const missingCrumbs = [];
const pageWalk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) pageWalk(full);
    else if (e.name === 'page.tsx') {
      const rel = path.relative(pagesDir, dir);
      if (!rel) continue; // the homepage is the root of the trail
      const text = fs.readFileSync(full, 'utf8');
      if (!/breadcrumbSchema/.test(text)) missingCrumbs.push('/' + rel);
    }
  }
};
pageWalk(pagesDir);
ok('every inner page emits a BreadcrumbList', missingCrumbs.length === 0, missingCrumbs.join(', '));

/* --- FAQ schema must use the visible copy --------------------------------- */
const faqPages = [];
for (const f of sources) {
  if (!/page\.tsx$/.test(f)) continue;
  const text = fs.readFileSync(f, 'utf8');
  if (/faqSchema\(/.test(text)) faqPages.push(path.relative(pagesDir, path.dirname(f)));
}
ok('the FAQ pages emit FAQPage schema', faqPages.length >= 5, faqPages.join(', '));

const faqSrc = fs.readFileSync(path.join(root, 'src/lib/schema.ts'), 'utf8');
ok(
  'FAQ schema is generated from the same array the page renders',
  /faqSchema\(items: FaqItem\[\]\)/.test(faqSrc),
  'if the schema text is written separately it can drift from the visible answers, which Google treats as spam',
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
