import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Clients } from '@/collections/Clients';
import { Enquiries } from '@/collections/Enquiries';
import { Jobs } from '@/collections/Jobs';
import { Media } from '@/collections/Media';
import { Posts } from '@/collections/Posts';
import { Testimonials } from '@/collections/Testimonials';
import { Users } from '@/collections/Users';
import { SiteSettings } from '@/globals/SiteSettings';
import { chooseConnection } from '@/lib/db-endpoint';
import { allowedOrigins, canonicalServerUrl } from '@/lib/origins';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fail loudly and early rather than letting Payload boot with a signing secret
 * of `undefined`, which would produce session tokens that anyone can forge.
 */
const secret = process.env.PAYLOAD_SECRET;
if (!secret) {
  throw new Error(
    'PAYLOAD_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to .env.local (and to the Vercel project settings).',
  );
}

/**
 * Neon exposes two connection strings for the same database, differing only by
 * `-pooler` in the hostname, and they are good at opposite things. The pooled
 * endpoint is what serverless needs; the direct one is what migrations need.
 * `chooseConnection` picks per command so nobody has to swap an environment
 * variable by hand and remember to swap it back. See src/lib/db-endpoint.ts.
 */
const endpoint = chooseConnection({
  argv: process.argv,
  pooled: process.env.DATABASE_URI,
  unpooled: process.env.DATABASE_URI_UNPOOLED,
});

endpoint.notes.forEach((n) => console.log(n));
endpoint.warnings.forEach((w) => console.warn(w));

const connectionString = endpoint.connectionString;

/**
 * Every hostname this deployment answers on. VERCEL_PROJECT_PRODUCTION_URL and
 * VERCEL_URL are injected by Vercel at runtime and cover the custom domain and
 * the per-deployment preview URL respectively, neither of which the build-time
 * NEXT_PUBLIC_SERVER_URL can know about.
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * In development, every IPv4 address this machine answers on.
 *
 * `next dev` prints a "Network" URL alongside localhost, and that is a separate
 * origin. Without it here, logging into the admin from a phone or a second
 * laptop on the same wifi fails the CSRF check and bounces back to the login
 * screen. Never computed in production, where the hostnames are known.
 */
const localAddresses = isProduction
  ? []
  : Object.values(os.networkInterfaces())
      // flatMap with a nullish fallback rather than .flat(): os.networkInterfaces()
      // is typed as possibly-undefined per interface, and a type predicate using
      // Boolean(i) does not narrow, which TypeScript rightly rejected.
      .flatMap((interfaces) => interfaces ?? [])
      .filter((i) => i.family === 'IPv4' && !i.internal)
      .map((i) => i.address);

const originEnv = {
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
  vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  vercelUrl: process.env.VERCEL_URL,
  extra: process.env.EXTRA_ORIGINS,
  devPort: isProduction ? undefined : process.env.PORT || '3000',
  localAddresses,
  // True on any Vercel deployment, including previews.
  isDeployed: Boolean(process.env.VERCEL),
};

const origins = allowedOrigins(originEnv);

if (process.env.VERCEL && /localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_SERVER_URL ?? '')) {
  console.warn(
    '[payload] NEXT_PUBLIC_SERVER_URL is set to a localhost address on a deployed\n' +
      '          environment. Falling back to the deployment hostname so media URLs\n' +
      '          are not minted as http://localhost:3000. Fix the variable in the\n' +
      '          Vercel project settings.',
  );
}

if (origins.length === 0) {
  console.warn(
    '[payload] No allowed origins resolved. Admin login will fail: the session\n' +
      '          cookie is set and then every authenticated request is rejected,\n' +
      '          which looks like the login page simply reloading. Set\n' +
      '          NEXT_PUBLIC_SERVER_URL to the origin the site is served from.',
  );
}

export default buildConfig({
  serverURL: canonicalServerUrl(originEnv),

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Cognovea',
    },
    // Payload's default is 'gravatar', which sends a hash of the signed-in
    // user's email to gravatar.com on every admin page load. That is a
    // third-party request from inside an authenticated session, made to render
    // a placeholder silhouette, and it is the same reason the admin gets no
    // analytics origins. Turning it off removes the request rather than adding
    // gravatar.com to the policy to permit it.
    avatar: 'default',
  },

  collections: [Posts, Jobs, Testimonials, Clients, Enquiries, Media, Users],
  globals: [SiteSettings],

  editor: lexicalEditor(),

  secret,

  typescript: {
    // `npm run generate:types` writes this. Commit it. The frontend imports
    // these types, so a missing file breaks the build for everyone else.
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: { connectionString },
    // Neon requires TLS. `push` is left on only outside production so schema
    // changes appear instantly in development; production uses real migrations
    // (`npm run migrate:create` then `npm run migrate`) so a deploy can never
    // silently alter or drop a column on live data.
    push: process.env.NODE_ENV !== 'production',
  }),

  // Powers the image sizes declared in the Media collection.
  sharp,

  // Only origins we own may call the API with credentials, so a third-party
  // site cannot drive the authenticated API using a logged-in admin's cookie.
  // Still an allowlist, just one that covers every hostname this app is
  // actually served from rather than only the configured one. See
  // src/lib/origins.ts for why a single entry silently broke admin login.
  cors: origins,
  csrf: origins,

  plugins: [
    // Serverless filesystems are ephemeral. A file written during one request
    // is gone by the next. So uploads go to blob storage in any environment
    // that has a token, and fall back to local disk for development.
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: { [Media.slug]: true },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
});
