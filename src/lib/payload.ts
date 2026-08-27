import configPromise from '@payload-config';
import { getPayload } from 'payload';

/**
 * The local API. This talks to the database in-process, no HTTP, no network
 * hop, no API token, so it is both faster and safer than calling the REST API
 * from a server component.
 *
 * Payload caches the instance internally, so calling this per request is fine.
 */
export async function getPayloadClient() {
  return getPayload({ config: configPromise });
}

/**
 * Every content query goes through here so a database outage degrades the page
 * instead of taking the whole site down with a 500.
 *
 * This matters more than it looks: the ten marketing pages are the commercially
 * important ones and they do not touch Payload at all, so a database problem
 * should never be able to affect them. This keeps the same promise for the
 * pages that do. An empty insights list is a far better outcome than an error
 * page, and it keeps a transient Neon cold-start from failing a production
 * build.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[payload] ${label} failed:`, error);
    return fallback;
  }
}
