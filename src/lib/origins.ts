/**
 * The origins Payload will accept authenticated, cookie-bearing requests from.
 *
 * This was a single entry built from NEXT_PUBLIC_SERVER_URL, which breaks the
 * moment the site is reachable at more than one hostname. The failure is
 * particularly unhelpful: the login POST succeeds and sets a cookie, the next
 * request is rejected as cross-origin, and the admin bounces back to the login
 * screen with no error. It reads as a wrong password.
 *
 * That happens on a custom domain that differs from the configured URL, and on
 * every preview deployment, because Vercel gives each one a unique hostname.
 *
 * Kept as a pure function so it can be tested without booting Payload.
 */

export type OriginEnv = {
  /** The canonical public URL, e.g. https://www.cognovea.com */
  serverUrl?: string;
  /** Vercel's production domain for the project, without a scheme. */
  vercelProductionUrl?: string;
  /** The hostname of this specific deployment, without a scheme. */
  vercelUrl?: string;
  /** Comma-separated extra origins, for a second custom domain. */
  extra?: string;
  /**
   * Development only. `next dev` serves on localhost *and* on the machine's LAN
   * address, and those are different origins: logging in through the "Network"
   * URL fails the CSRF check exactly as a wrong custom domain does. The caller
   * supplies the addresses, so this stays a pure function.
   */
  devPort?: string;
  localAddresses?: string[];
};

function normalise(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    // Origin only: a trailing slash or a path makes the comparison fail, and
    // pasting a full URL into the env var is an easy mistake to make.
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

/**
 * `www.example.com` and `example.com` are different origins to a browser, and
 * therefore to a CSRF check. Whichever one is configured, the other is added.
 *
 * This is not a loosening worth worrying about: reaching www of a domain you
 * own requires controlling that domain's DNS, and anyone who does has already
 * won. Leaving it out, meanwhile, produces a 403 on every authenticated request
 * the moment the site is served from the variant nobody configured.
 */
function withHostVariant(origin: string): string[] {
  try {
    const url = new URL(origin);
    if (url.hostname === 'localhost' || /^[\d.]+$/.test(url.hostname)) return [origin];

    const paired = new URL(origin);
    paired.hostname = url.hostname.startsWith('www.')
      ? url.hostname.slice(4)
      : `www.${url.hostname}`;
    return [origin, paired.origin];
  } catch {
    return [origin];
  }
}

export function allowedOrigins(env: OriginEnv): string[] {
  const devHosts = env.devPort
    ? ['localhost', '127.0.0.1', ...(env.localAddresses ?? [])].map((h) => `http://${h}:${env.devPort}`)
    : [];

  const candidates = [
    env.serverUrl,
    env.vercelProductionUrl,
    env.vercelUrl,
    ...(env.extra ? env.extra.split(',') : []),
    ...devHosts,
  ];

  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate) continue;
    const origin = normalise(candidate);
    if (!origin) continue;
    for (const variant of withHostVariant(origin)) seen.add(variant);
  }
  return [...seen];
}

function isLoopback(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

/**
 * The single canonical URL Payload uses to build absolute links.
 *
 * A loopback value is refused when `isDeployed` is set. This is not
 * hypothetical tidiness: NEXT_PUBLIC_SERVER_URL copied from .env.local into
 * Vercel makes Payload mint every media URL as http://localhost:3000/..., and
 * the admin's own thumbnails then point at the reviewer's machine. They are
 * blocked by the content security policy and appear broken, while the public
 * pages look fine, because the frontend normaliser only rewrites URLs it
 * renders itself and never sees the ones the admin builds internally.
 *
 * Falling back to the deployment's real hostname is always more correct than
 * emitting localhost from a server that is not the reader's machine.
 */
export function canonicalServerUrl(env: OriginEnv & { isDeployed?: boolean }): string | undefined {
  const configured = normalise(env.serverUrl ?? '');
  const deployed = normalise(env.vercelProductionUrl ?? '') ?? normalise(env.vercelUrl ?? '');

  if (configured && env.isDeployed && isLoopback(configured)) {
    return deployed ?? undefined;
  }

  return configured ?? deployed ?? undefined;
}
