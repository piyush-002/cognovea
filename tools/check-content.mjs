/**
 * Prints what the site can actually see.
 *
 * Run this in a normal terminal, not through any sandbox, since it needs to
 * reach Neon:
 *
 *   node tools/check-content.mjs
 *
 * "I published it and it is not on the site" has several causes that look
 * identical from the outside: saved as a draft rather than published, no image
 * on the record, or a page cached from a build that predates the content. This
 * distinguishes them by asking the database the same questions the pages ask.
 */
import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../src/payload.config.ts';

const payload = await getPayload({ config });

const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const good = (s) => `\x1b[32m${s}\x1b[0m`;

async function report(slug, describe) {
  // overrideAccess:true so drafts are included; the point is to show what is
  // there and why the public queries skip it.
  const res = await payload.find({ collection: slug, limit: 100, depth: 1, overrideAccess: true });
  console.log(`\n${slug}  (${res.totalDocs} total)`);
  if (!res.docs.length) {
    console.log(dim('  nothing in this collection'));
    return;
  }
  for (const d of res.docs) {
    const published = d._status === 'published';
    console.log(`  ${published ? good('published') : bad('DRAFT    ')}  ${describe(d)}`);
  }
  const live = res.docs.filter((d) => d._status === 'published').length;
  if (live === 0) console.log(bad(`  none published, so nothing renders on the site`));
}

await report('testimonials', (d) => {
  const svc = Array.isArray(d.services) && d.services.length ? d.services.join(', ') : dim('untagged');
  return `${d.authorName ?? '(no name)'} ${dim('|')} featured: ${d.featured ? 'yes' : 'no'} ${dim('|')} order: ${d.order ?? 0} ${dim('|')} services: ${svc}`;
});

await report('clients', (d) => {
  const logo = d.logo?.url ? 'has logo' : bad('NO LOGO — will be filtered out');
  return `${d.name ?? '(no name)'} ${dim('|')} featured: ${d.featured ? 'yes' : 'no'} ${dim('|')} order: ${d.order ?? 0} ${dim('|')} ${logo}`;
});

await report('posts', (d) => `${d.title ?? '(no title)'} ${dim('|')} /insights/${d.slug ?? '?'}`);
await report('jobs', (d) => `${d.title ?? '(no title)'} ${dim('|')} ${d.location ?? ''}`);

// Which quote each page will actually show.
const { PAGE_ORDER, pickIndex } = await import('../src/lib/testimonial-pick.ts');
const pub = await payload.find({
  collection: 'testimonials', limit: 100, depth: 0, sort: 'order',
  where: { _status: { equals: 'published' } },
});
const featured = pub.docs.filter((d) => d.featured);
const pool = [...featured, ...pub.docs.filter((d) => !d.featured)];

console.log('\nWhich testimonial each page shows');
if (!pool.length) {
  console.log(bad('  none published — every page renders no testimonial section at all'));
} else {
  for (const key of PAGE_ORDER) {
    const service = key === 'home' ? null : key;
    const tagged = service
      ? pub.docs.find((d) => Array.isArray(d.services) && d.services.includes(service))
      : null;
    const chosen = tagged ?? pool[pickIndex(key, pool.length)];
    const how = tagged ? 'tagged for this page' : dim('fallback');
    console.log(`  ${key.padEnd(30)} ${chosen?.authorName ?? bad('none')}  ${how}`);
  }
}

console.log('\nIf something says DRAFT above, open it in the admin and press Publish.');
console.log('If it says published and still is not on the site, the page is cached');
console.log('from an older build — redeploy, or wait five minutes.\n');
process.exit(0);
