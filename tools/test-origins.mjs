/**
 * Tests the CSRF/CORS origin list.
 *
 * Worth testing rather than eyeballing: getting this wrong does not throw or
 * log. The admin simply refuses every authenticated request and returns the
 * user to the login page, which looks like a bad password.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const target = path.join(here, '..', 'src', 'lib', 'origins.ts');

let allowedOrigins;
let canonicalServerUrl;
try {
  ({ allowedOrigins, canonicalServerUrl } = await import(`file://${target}`));
} catch (nativeError) {
  try {
    const require = createRequire(import.meta.url);
    const esbuild = require('esbuild');
    const out = path.join(here, '..', '.origins-test.cjs');
    await esbuild.build({
      entryPoints: [target],
      outfile: out,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node20',
      logLevel: 'silent',
    });
    ({ allowedOrigins, canonicalServerUrl } = require(out));
    fs.rmSync(out, { force: true });
  } catch {
    console.log(`SKIP  Node cannot run TypeScript here (${process.version}) and esbuild is unavailable.`);
    console.log(`      ${nativeError.message}`);
    process.exit(0);
  }
}

let pass = 0;
let fail = 0;
const eq = (name, got, want) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a === b) pass++;
  else {
    fail++;
    console.log(`  FAIL  ${name}\n        got  ${a}\n        want ${b}`);
  }
};

eq(
  'configured URL alone',
  allowedOrigins({ serverUrl: 'https://cognovea.com' }),
  ['https://cognovea.com'],
);

// The case that caused this: served from a domain the config did not name.
eq(
  'custom domain plus configured URL',
  allowedOrigins({
    serverUrl: 'https://cognovea.com',
    vercelProductionUrl: 'nextlooptechology.com',
  }),
  ['https://cognovea.com', 'https://nextlooptechology.com'],
);

eq(
  'preview deployment is included',
  allowedOrigins({
    serverUrl: 'https://cognovea.com',
    vercelUrl: 'cognovea-git-feat-abc123.vercel.app',
  }),
  ['https://cognovea.com', 'https://cognovea-git-feat-abc123.vercel.app'],
);

eq(
  'a trailing slash does not create a mismatch',
  allowedOrigins({ serverUrl: 'https://cognovea.com/' }),
  ['https://cognovea.com'],
);

eq(
  'a pasted path is reduced to its origin',
  allowedOrigins({ serverUrl: 'https://cognovea.com/admin' }),
  ['https://cognovea.com'],
);

eq(
  'localhost keeps its port and scheme',
  allowedOrigins({ serverUrl: 'http://localhost:3000' }),
  ['http://localhost:3000'],
);

eq(
  'extra domains, comma separated and untrimmed',
  allowedOrigins({ serverUrl: 'https://cognovea.com', extra: ' www.cognovea.com , https://staging.cognovea.com ' }),
  ['https://cognovea.com', 'https://www.cognovea.com', 'https://staging.cognovea.com'],
);

eq('duplicates collapse', allowedOrigins({ serverUrl: 'https://cognovea.com', extra: 'cognovea.com' }), [
  'https://cognovea.com',
]);

eq('nothing configured yields an empty list', allowedOrigins({}), []);
eq('a malformed value is dropped, not thrown', allowedOrigins({ serverUrl: 'not a url', extra: '://' }), []);

eq('canonical prefers the configured URL', canonicalServerUrl({ serverUrl: 'https://cognovea.com', vercelProductionUrl: 'x.com' }), 'https://cognovea.com');
eq('canonical falls back to the production domain', canonicalServerUrl({ vercelProductionUrl: 'nextlooptechology.com' }), 'https://nextlooptechology.com');
eq('canonical is undefined when nothing is set', canonicalServerUrl({}), undefined);

// --- development: the LAN "Network" URL is a separate origin ---------------

eq(
  'dev adds localhost and loopback',
  allowedOrigins({ serverUrl: 'http://localhost:3000', devPort: '3000' }),
  ['http://localhost:3000', 'http://127.0.0.1:3000'],
);

eq(
  'dev adds the machine LAN address',
  allowedOrigins({ serverUrl: 'http://localhost:3000', devPort: '3000', localAddresses: ['192.168.0.174'] }),
  ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.0.174:3000'],
);

eq(
  'dev respects a non-default port',
  allowedOrigins({ devPort: '4000', localAddresses: ['10.0.0.5'] }),
  ['http://localhost:4000', 'http://127.0.0.1:4000', 'http://10.0.0.5:4000'],
);

eq(
  'production adds no local origins',
  allowedOrigins({ serverUrl: 'https://cognovea.com', localAddresses: ['192.168.0.174'] }),
  ['https://cognovea.com'],
);

// --- a localhost serverURL must never survive onto a deployment ------------

eq(
  'deployed: localhost is refused in favour of the real domain',
  canonicalServerUrl({
    serverUrl: 'http://localhost:3000',
    vercelProductionUrl: 'nextlooptechology.com',
    isDeployed: true,
  }),
  'https://nextlooptechology.com',
);

eq(
  'deployed: falls through to the preview URL when there is no production domain',
  canonicalServerUrl({ serverUrl: 'http://127.0.0.1:3000', vercelUrl: 'x-abc.vercel.app', isDeployed: true }),
  'https://x-abc.vercel.app',
);

eq(
  'local: localhost is exactly what we want',
  canonicalServerUrl({ serverUrl: 'http://localhost:3000' }),
  'http://localhost:3000',
);

eq(
  'deployed: a correct value is left alone',
  canonicalServerUrl({ serverUrl: 'https://cognovea.com', vercelProductionUrl: 'x.com', isDeployed: true }),
  'https://cognovea.com',
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
