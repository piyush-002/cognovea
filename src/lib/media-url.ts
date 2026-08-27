/**
 * Normalises the URLs Payload returns for uploaded files.
 *
 * Payload hands back an absolute URL built from `serverURL`, so a local upload
 * arrives as `http://localhost:3000/api/media/file/logo.png`. Passing that to
 * `next/image` fails: the optimiser treats any absolute URL as remote and
 * refuses hosts absent from `images.remotePatterns`.
 *
 * Allow-listing `localhost` would only move the problem, because production
 * would then arrive as `https://cognovea.com/api/media/file/logo.png` and need
 * its own entry, and a preview deployment would need another. Making the URL
 * relative sidesteps all of it: a same-origin path needs no configuration and
 * is correct in every environment.
 *
 * Genuinely remote files, such as Vercel Blob, are left absolute and stay
 * covered by remotePatterns.
 */
export function toSameOriginPath(url: string, serverUrl?: string): string {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Already relative, which is what we want.
    return url;
  }

  const isOwnOrigin = (() => {
    if (serverUrl) {
      try {
        if (new URL(serverUrl).origin === parsed.origin) return true;
      } catch {
        // A malformed serverURL should not decide this; fall through.
      }
    }
    // Fallback for a missing or unparseable serverURL: a loopback host is
    // never a CDN, so it is always ours.
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  })();

  return isOwnOrigin ? `${parsed.pathname}${parsed.search}` : url;
}
