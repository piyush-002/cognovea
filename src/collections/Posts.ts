import type { CollectionConfig } from 'payload';
import { authenticated, publishedOrAuthenticated } from '@/access';
import { slugField } from '@/fields/slug';

/**
 * Insights. The blog. This is the content the sitemap you supplied is full of,
 * and the main reason a CMS earns its place on this site.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Insight', plural: 'Insights' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Articles published under /insights.',
    preview: (doc) => (doc?.slug ? `/insights/${doc.slug}` : null),
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    // Drafts let an editor stage a post without it appearing on the site, and
    // give a version history to roll back to.
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 25,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 160,
    },
    slugField('title'),
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Used for ordering and for the datePublished in structured data.',
      },
      hooks: {
        // Stamp a publish date the first time it goes live, so the author never
        // has to remember and structured data is never missing datePublished.
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData?._status === 'published' && !value) return new Date();
            return value;
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description:
          'One or two sentences. Used on the insights index, in social previews, and as the meta description if you leave the SEO tab empty.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Shown at the top of the article and in social previews.' },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      admin: { position: 'sidebar' },
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'readingMinutes',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Estimated automatically from the article length.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'SEO',
          description: 'Leave blank to fall back to the title and excerpt above.',
          fields: [
            { name: 'metaTitle', type: 'text', maxLength: 70 },
            { name: 'metaDescription', type: 'textarea', maxLength: 180 },
            {
              name: 'noindex',
              type: 'checkbox',
              defaultValue: false,
              label: 'Hide this article from search engines',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Reading time from the Lexical tree. Counts text nodes at any depth
        // rather than assuming a flat structure, at 200 words per minute.
        try {
          let words = 0;
          const walk = (node: unknown): void => {
            if (!node || typeof node !== 'object') return;
            const n = node as Record<string, unknown>;
            if (typeof n.text === 'string') words += n.text.trim().split(/\s+/).filter(Boolean).length;
            if (Array.isArray(n.children)) n.children.forEach(walk);
          };
          walk((data?.content as Record<string, unknown> | undefined)?.root);
          if (words > 0) data.readingMinutes = Math.max(1, Math.round(words / 200));
        } catch {
          // Reading time is a nicety; never block a save over it.
        }
        return data;
      },
    ],
  },
};

export default Posts;
