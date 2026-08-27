import type { Field } from 'payload';

/** Lowercase, strip accents, collapse anything non-alphanumeric to a single dash. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

/**
 * A URL slug that fills itself in from another field but stays editable.
 *
 * It is deliberately *not* regenerated on every save: once a post is published
 * its URL is public, may be linked from elsewhere and is indexed by Google.
 * Silently changing it because someone fixed a typo in the title would break
 * those links. So this only auto-fills when the slug is empty.
 */
export function slugField(from = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description:
        'The URL for this entry. Filled in automatically from the title, but you can edit it. Avoid changing it after publishing. The old URL will stop working.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === 'string' && value.length > 0) return slugify(value);
          const source = data?.[from];
          if (typeof source === 'string' && source.length > 0) return slugify(source);
          return value;
        },
      ],
    },
  };
}
