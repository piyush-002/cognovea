/**
 * Chooses between Neon's pooled and direct connection endpoints.
 *
 * Kept as a pure function, separate from payload.config.ts, so it can be tested
 * without booting Payload or connecting to a database. See tools/test-db-endpoint.mjs.
 */

export type EndpointChoice = {
  connectionString: string;
  /** True when the direct (unpooled) endpoint was selected. */
  direct: boolean;
  /** Warnings to print. Empty when nothing looks wrong. */
  warnings: string[];
  /** Informational messages to print. */
  notes: string[];
};

export function isMigrationCommand(argv: string[]): boolean {
  // Only the arguments after the executable and script matter: `payload migrate`
  // or `payload migrate:create`. Matching anywhere in argv would misfire on a
  // project checked out into a directory whose path contains "migrate".
  return argv.slice(2).some((arg) => arg === 'migrate' || arg.startsWith('migrate:'));
}

export function chooseConnection({
  argv,
  pooled,
  unpooled,
}: {
  argv: string[];
  pooled: string | undefined;
  unpooled: string | undefined;
}): EndpointChoice {
  if (!pooled) {
    throw new Error(
      'DATABASE_URI is not set. Copy the POOLED Neon connection string (the host contains "-pooler") into .env.local.',
    );
  }

  const migrating = isMigrationCommand(argv);
  const warnings: string[] = [];
  const notes: string[] = [];

  // Transaction-mode pooling drops session state between statements, so it does
  // not support SET, advisory locks or temporary tables, which is what schema
  // migrations depend on. Neon's guidance is to migrate over the direct endpoint.
  if (migrating && unpooled) {
    notes.push('[payload] migration detected, using the direct (unpooled) Neon endpoint.');
    return { connectionString: unpooled, direct: true, warnings, notes };
  }

  if (migrating && !unpooled) {
    warnings.push(
      '[payload] migration detected, but DATABASE_URI_UNPOOLED is not set, so this runs over the pooled endpoint.\n' +
        '          If it fails or hangs, add the direct connection string (host WITHOUT "-pooler") as\n' +
        '          DATABASE_URI_UNPOOLED and run it again.',
    );
  }

  // Runtime on a direct endpoint is the more dangerous mistake of the two: it
  // works perfectly in development and only fails once real traffic exhausts
  // Postgres's connection limit.
  if (!migrating && looksLikeNeon(pooled) && !isPooledHost(pooled)) {
    warnings.push(
      '[payload] DATABASE_URI does not look like a pooled Neon endpoint (no "-pooler" in the host).\n' +
        '          Serverless will exhaust the connection limit on a direct endpoint under load.',
    );
  }

  return { connectionString: pooled, direct: false, warnings, notes };
}

function looksLikeNeon(uri: string): boolean {
  return uri.includes('neon.tech');
}

function isPooledHost(uri: string): boolean {
  // The pooler suffix belongs to the endpoint id in the host, e.g.
  // ep-cool-darkness-123456-pooler.ap-south-1.aws.neon.tech, checking the whole
  // string would also match a database or password that happened to contain it.
  try {
    const { hostname } = new URL(uri);
    return hostname.includes('-pooler.');
  } catch {
    return uri.includes('-pooler.');
  }
}
