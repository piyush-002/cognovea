import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { resendAdapter } from '@payloadcms/email-resend';
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
import { ToolLeads } from '@/collections/ToolLeads';
import { Users } from '@/collections/Users';
import { SiteSettings } from '@/globals/SiteSettings';
import { chooseConnection } from '@/lib/db-endpoint';
import { allowedOrigins, canonicalServerUrl } from '@/lib/origins';
import { CANONICAL_URL } from '@/lib/host-redirect.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Fail loudly and early rather than letting Payload boot with a signing secret
 * of `undefined`, which would produce session tokens that anyone can forge.
 */
/**
 * A sender on the wrong domain is silently fatal.
 *
 * Resend rejects any `from` address on a domain that is not verified on the
 * account, so a single mistyped character in EMAIL_FROM turns every password
 * reset and every notification into a rejected API call — visible only in a log
 * nobody is reading. This already happened once, to `noreply@cogovea.com`.
 *
 * A warning rather than a throw: email being misconfigured is not a reason for
 * the website to refuse to start.
 */
const from = process.env.EMAIL_FROM?.trim();
if (from && !from.toLowerCase().endsWith(`@${new URL(CANONICAL_URL).hostname.replace(/^www\./, '')}`)) {
  console.warn(
    `[email] EMAIL_FROM is "${from}", which is not on the site's own domain. Resend will reject every send from an unverified domain — check for a typo.`,
  );
}

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

/**
 * Whether Payload may rewrite the database schema to match this config.
 *
 * `push` compares the config to the live schema on every dev boot and alters
 * the database to match. That is exactly what you want against a scratch
 * database and exactly what you do not want against one holding real content,
 * because "alter to match" includes dropping a table or column it cannot
 * account for. Drizzle asks first, but it asks in a terminal, at the end of a
 * long boot log, with a y/N prompt that is easy to answer by reflex.
 *
 * It used to be on for every non-production NODE_ENV, which meant on for every
 * local dev server. This project spent most of its life with local and the
 * deployed site pointed at ONE Neon database, so "local dev" and "the live
 * content" were the same rows. A single reflexive Y would have taken the
 * published logos, testimonials and articles with it.
 *
 * So it is now opt-in and off by default. Set ALLOW_SCHEMA_PUSH=1 in
 * .env.local when you are certain the connection string points somewhere
 * disposable — your own Neon branch, or a local Postgres. Without it, schema
 * changes go through a migration, which writes a file you can read before it
 * touches anything:
 *
 *     npm run migrate:create   # writes SQL to src/migrations, review it
 *     npm run migrate          # applies it
 *
 * The cost of the default being off is one extra command when you add a
 * collection. The cost of it being on was the whole database.
 */
const allowPush = process.env.NODE_ENV !== 'production' && process.env.ALLOW_SCHEMA_PUSH === '1';

if (process.env.NODE_ENV !== 'production' && !allowPush) {
  console.log(
    '[payload] Schema push is off. If the config and the database have drifted,\n' +
      '          queries will fail until you run:\n' +
      '            npm run migrate:create   (writes SQL to src/migrations — read it)\n' +
      '            npm run migrate          (applies it)\n' +
      '          Set ALLOW_SCHEMA_PUSH=1 in .env.local to push instead, but only\n' +
      '          when DATABASE_URI points at a database you can afford to lose.',
  );
}

if (allowPush) {
  console.warn(
    '[payload] ALLOW_SCHEMA_PUSH=1 — this dev server may ALTER OR DROP tables in\n' +
      `          the database at ${(() => {
        try {
          return new URL(connectionString ?? '').hostname;
        } catch {
          return 'the configured connection';
        }
      })()}\n` +
      '          Make sure that is not the database the live site reads from.',
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

  collections: [Posts, Jobs, Testimonials, Clients, Enquiries, ToolLeads, Media, Users],
  globals: [SiteSettings],

  editor: lexicalEditor(),

  secret,

  typescript: {
    // `npm run generate:types` writes this. Commit it. The frontend imports
    // these types, so a missing file breaks the build for everyone else.
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },


  /**

   * Without this, Payload logs a warning at startup and every send is a no-op:

   * password resets are generated, recorded, and never delivered, which looks

   * from the outside exactly like a broken account.

   *

   * The key is only present in deployed environments and in a developer's own

   * .env.local. When it is absent the adapter is not registered at all rather

   * than registered with an empty string, so the failure is the honest one

   * Payload already reports instead of a rejected API call per email.

   */

  ...(process.env.RESEND_API_KEY

    ? {

        email: resendAdapter({

          defaultFromAddress: process.env.EMAIL_FROM || 'noreply@cognovea.com',

          defaultFromName: 'Cognovea',

          apiKey: process.env.RESEND_API_KEY,

        }),

      }

    : {}),

  db: postgresAdapter({
    pool: { connectionString },
    push: allowPush,
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
