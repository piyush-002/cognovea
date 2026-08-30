import type { CollectionConfig } from 'payload';

/**
 * Counters behind the rate limiter. Not content, and not for human eyes.
 *
 * Registered as a Payload collection for one reason: so Payload knows the table
 * exists. Drizzle's `push` proposes a DROP for every table it finds in the
 * database and cannot find in the config, so a table created outside Payload is
 * a table a routine `npm run dev` offers to delete. That is the same trap that
 * produced the DATA LOSS prompt earlier in this project, and it is not worth
 * re-entering to save a file.
 *
 * Nothing reads it through Payload's API, though. src/lib/rate-limit.ts talks
 * to this table in one atomic SQL statement, because a limiter implemented as
 * read-then-write loses the race against precisely the burst it exists to
 * refuse: twenty concurrent requests all read "0" and all decide they are the
 * first.
 */
export const RateLimits: CollectionConfig = {
  slug: 'rate-limits',
  labels: { singular: 'Rate limit counter', plural: 'Rate limit counters' },
  admin: {
    // Nothing here is useful to an editor, and a list of IP-derived keys is
    // personal data sitting in a UI where nobody has a reason to look at it.
    hidden: true,
    useAsTitle: 'key',
  },
  access: {
    // No door at all. The limiter uses SQL directly; there is no legitimate
    // reason for anything to reach these rows over the API.
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'windowStart', type: 'date', required: true },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
  ],
};

export default RateLimits;
