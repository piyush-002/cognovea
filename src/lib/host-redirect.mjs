/**
 * One host serves the site; the other permanently redirects to it.
 *
 * Plain JavaScript rather than TypeScript because next.config.mjs has to import
 * it, and a config file cannot import a .ts module. The alternative was to
 * inline the logic in the config and restate it in a test, which is how two
 * copies of a rule drift apart.
 *
 * The problem this solves: with no redirect, https://example.com/x and
 * https://www.example.com/x both return 200 with byte-identical HTML, and both
 * declare the same canonical. Search engines then have to guess which is the
 * real one. Links, and whatever ranking they carry, split between the two.
 * Nothing errors, and it is invisible in a browser.
 *
 * The canonical host is read from the environment rather than hardcoded, so
 * staging redirects to staging and production redirects to production without
 * a per-environment code change.
 */

/**
 * The canonical public URL. The single source of truth for which spelling of
 * the domain ranks.
 *
 * It lives here, in plain JavaScript, because next.config.mjs cannot import a
 * .ts module and this value has to reach both the redirect and the canonical
 * tags. src/lib/site.ts re-exports it. Two copies of this string is precisely
 * the bug being fixed: canonicals said the apex, every real URL was www.
 *
 * www because the DNS already redirects the apex to www before a request
 * reaches the app. Change this and the DNS together, never one alone: if this
 * says apex while the DNS says www, the app sends www to the apex, the DNS
 * sends it back, and the site loops until a browser gives up.
 */
export const CANONICAL_URL = 'https://www.cognovea.com';

/** Hostname only, from a URL or a bare host. Null if it cannot be parsed. */
export function hostOf(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`).hostname || null;
  } catch {
    return null;
  }
}

/** The www counterpart of a host, or the apex of a www host. */
export function pairedHost(host) {
  if (!host) return null;
  // An IP address or localhost has no www variant, and inventing one would
  // produce a redirect to a host that does not resolve.
  if (host === 'localhost' || /^[\d.]+$/.test(host) || host.includes(':')) return null;
  return host.startsWith('www.') ? host.slice(4) : `www.${host}`;
}

/**
 * Which host this deployment should serve on.
 *
 * NEXT_PUBLIC_SERVER_URL first, because it is the value an operator sets
 * deliberately. VERCEL_PROJECT_PRODUCTION_URL second, so a deployment with the
 * variable unset still redirects to its own domain rather than doing nothing.
 * A loopback value is ignored on a deployment: it means the local .env was
 * copied into the dashboard, and redirecting the live site to localhost would
 * take it off the internet.
 */
export function canonicalHost({ serverUrl, vercelProductionUrl, isDeployed } = {}) {
  const configured = hostOf(serverUrl);
  const isLoopback = configured === 'localhost' || configured === '127.0.0.1' || configured === '::1';

  if (configured && !(isDeployed && isLoopback)) return configured;
  return hostOf(vercelProductionUrl);
}

/**
 * Whether the deployment is serving the canonical domain at all.
 *
 * Compared apex-insensitively: staging is a different domain, www is the same
 * domain spelled differently.
 */
function sameDomain(a, b) {
  const strip = (h) => (h ? h.replace(/^www\./, '') : null);
  const x = strip(a);
  const y = strip(b);
  return Boolean(x && y && x === y);
}

/**
 * The redirect rules for next.config.mjs.
 *
 * Empty in development and on preview deployments. Locally there is no www to
 * redirect from; on a preview the hostname is generated per deployment and
 * sending it to the production domain would make previews impossible to review.
 */
export function hostRedirects(env = {}) {
  const { serverUrl, vercelProductionUrl, isDeployed, isPreview } = env;

  if (!isDeployed || isPreview) return [];

  // Which host this deployment answers on, which on staging is a different
  // domain entirely.
  const serving = canonicalHost({ serverUrl, vercelProductionUrl, isDeployed });
  if (!serving) return [];

  // The direction comes from CANONICAL_URL when this deployment serves that
  // domain, and never from the environment variable.
  //
  // This is the loop guard. The DNS already redirects the apex to www. If the
  // variable were allowed to decide and someone set it to the apex, the app
  // would redirect www to the apex, the DNS would send it back, and the site
  // would be unreachable — a worse outcome than the mismatch being fixed, and
  // caused by editing a dashboard field. A constant in a reviewed file cannot
  // drift that way.
  const canonicalDomainHost = hostOf(CANONICAL_URL);
  const canonical = sameDomain(serving, canonicalDomainHost) ? canonicalDomainHost : serving;
  if (!canonical) return [];

  const other = pairedHost(canonical);
  if (!other || other === canonical) return [];

  return [
    {
      // Every path, including the admin and the API: one host, or the session
      // cookie set on one is not sent to the other.
      source: '/:path*',
      has: [{ type: 'host', value: other }],
      destination: `https://${canonical}/:path*`,
      // 308. Permanent, and unlike 301 it is defined not to let a client
      // silently turn a POST into a GET, which matters because this also
      // covers form posts and the admin API.
      permanent: true,
    },
  ];
}

/**
 * Whether this deployment may be crawled.
 *
 * Every page declares a canonical URL built from CANONICAL_URL, so a
 * deployment reachable at some other hostname — staging, a preview, the
 * .vercel.app address — serves a complete copy of the site whose pages all
 * claim to live somewhere else. Search engines treat that as duplicate content
 * across hosts and choose for themselves, which is the exact problem the
 * canonical tag exists to prevent.
 *
 * Derived from the domain rather than from VERCEL_ENV so it corrects itself:
 * point the real domain at the project, set NEXT_PUBLIC_SERVER_URL to match,
 * and crawling turns on with no code change. Leave them out of step and it
 * stays off, which is the safe direction to fail in.
 *
 * robots.txt is a request, not access control. It keeps well-behaved crawlers
 * out of staging; it does not stop anyone reading the pages. Use HTTP auth or
 * Vercel's deployment protection if the content itself must not be public.
 */
export function shouldAllowCrawling({ siteUrl, serverUrl, vercelProductionUrl, isDeployed } = {}) {
  // Locally there is nothing to protect and nothing crawling.
  if (!isDeployed) return true;

  const canonical = hostOf(siteUrl);
  const serving = hostOf(serverUrl) ?? hostOf(vercelProductionUrl);

  // Unknown serving host: refuse rather than guess. A wrongly indexed staging
  // copy is slow and awkward to undo; a missed day of crawling is neither.
  if (!canonical || !serving) return false;

  return sameDomain(canonical, serving);
}
