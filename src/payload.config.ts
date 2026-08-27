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

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Cognovea',
    },
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

  // CORS/CSRF: only this site may call the API with credentials. Without this,
  // any origin could drive the authenticated API using a logged-in admin's
  // cookie.
  cors: process.env.NEXT_PUBLIC_SERVER_URL ? [process.env.NEXT_PUBLIC_SERVER_URL] : [],
  csrf: process.env.NEXT_PUBLIC_SERVER_URL ? [process.env.NEXT_PUBLIC_SERVER_URL] : [],

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
