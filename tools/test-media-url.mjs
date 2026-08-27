/**
 * Tests URL normalisation for Payload uploads.
 *
 * Written because the failure only appears once a real file is uploaded, which
 * needs a database and a running admin: none of the other checks in tools/ can
 * reach it. The logic is pure, so it can be tested without any of that.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const target = path.join(here, '..', 'src', 'lib', 'media-url.ts');

let toSameOriginPath;
try {
  ({ toSameOriginPath } = await import(`file://${target}`));
} catch (nativeError) {
  try {
    const require = createRequire(import.meta.url);
    const esbuild = require('esbuild');
    const out = path.join(here, '..', '.media-url-test.cjs');
    await esbuild.build({
      entryPoints: [target],
      outfile: out,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node20',
      logLevel: 'silent',
    });
    ({ toSameOriginPath } = require(out));
    fs.rmSync(out, { force: true });
  } catch {
    console.log(`SKIP  Node cannot run TypeScript here (${process.version}) and esbuild is unavailable.`);
    console.log(`      ${nativeError.message}`);
    process.exit(0);
  }
}

const LOCAL = 'http://localhost:3000';
const PROD = 'https://cognovea.com';
const BLOB = 'https://abc123.public.blob.vercel-storage.com/logo-x9.png';

const cases = [
  ['local upload becomes relative', 'http://localhost:3000/api/media/file/jhanalogo.png', LOCAL, '/api/media/file/jhanalogo.png'],
  ['production upload becomes relative', 'https://cognovea.com/api/media/file/logo.png', PROD, '/api/media/file/logo.png'],
  ['query string is preserved', 'http://localhost:3000/api/media/file/a.png?w=200', LOCAL, '/api/media/file/a.png?w=200'],
  ['blob storage stays absolute', BLOB, PROD, BLOB],
  ['already-relative path is untouched', '/api/media/file/a.png', LOCAL, '/api/media/file/a.png'],
  ['a different host stays absolute', 'https://cdn.example.com/a.png', PROD, 'https://cdn.example.com/a.png'],
  ['empty string survives', '', LOCAL, ''],
  // Without a serverURL, loopback is still recognisably ours.
  ['loopback without serverURL', 'http://localhost:3000/api/media/file/a.png', undefined, '/api/media/file/a.png'],
  ['127.0.0.1 without serverURL', 'http://127.0.0.1:3000/api/media/file/a.png', undefined, '/api/media/file/a.png'],
  // A remote host with no serverURL must NOT be rewritten: doing so would point
  // the image at our own origin and 404.
  ['remote host without serverURL stays absolute', BLOB, undefined, BLOB],
  ['malformed serverURL does not throw', 'https://cognovea.com/api/media/file/a.png', 'not a url', 'https://cognovea.com/api/media/file/a.png'],
  ['port mismatch is a different origin', 'http://localhost:4000/api/media/file/a.png', LOCAL, '/api/media/file/a.png'],
];

let pass = 0;
let fail = 0;
for (const [name, url, server, want] of cases) {
  const got = toSameOriginPath(url, server);
  if (got === want) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
