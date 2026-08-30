import type { CollectionConfig } from 'payload';
import { authenticated, publishedOrAuthenticated } from '@/access';
import { slugField } from '@/fields/slug';
import { portfolioHooks } from '@/lib/revalidate';

/**
 * Portfolio: things we have built, and work we have done.
 *
 * One collection rather than two, with a `kind` that says which sort each entry
 * is. A product we own and a client engagement want most of the same fields —
 * a summary, a cover, a body with images anywhere in it — and differ in about
 * four. Splitting them would mean maintaining two nearly identical block sets
 * and a second set of routes, and would put an arbitrary line between "the
 * platform we built" and "what it did for somebody".
 *
 * `clientName` is only meaningful for a client engagement, and it is guarded:
 * the name renders only when `clientPermission` is ticked. Naming a client who
 * has not agreed to be named is the kind of mistake that ends a relationship,
 * and it should take a deliberate act to do it rather than an empty field.
 *
 * The body is a blocks field because the original requirement was images at
 * arbitrary positions rather than a fixed template. Every block is optional and
 * repeatable, so an entry can be all prose, or a gallery with two paragraphs,
 * without a developer.
 */
export const Portfolio: CollectionConfig = {
  slug: 'portfolio',
  labels: { singular: 'Case study', plural: 'Portfolio & Case Studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'sector', 'featured', 'publishedAt'],
    group: 'Content',
    description:
      'Case studies of what we have built and the work we have done. Drafts stay private until published.',
    preview: (doc) => (doc?.slug ? `/portfolio/${doc.slug}` : null),
  },
  versions: { drafts: true },
  access: {
    // The same rule Posts uses, from the shared helper: a draft is invisible to
    // the public and visible to anyone logged in.
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: portfolioHooks,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'The page H1. Keep it under about 60 characters or a search result truncates it.' },
    },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'product',
          options: [
            { label: 'Something we built', value: 'product' },
            { label: 'Work for a client', value: 'client' },
          ],
          admin: {
            width: '50%',
            description: 'Decides whether the client fields below apply.',
          },
        },
        {
          name: 'sector',
          type: 'select',
          options: [
            { label: 'Manufacturing', value: 'manufacturing' },
            { label: 'Oil & Gas', value: 'oil-and-gas' },
            { label: 'Fintech', value: 'fintech' },
            { label: 'Retail & E-commerce', value: 'retail-ecommerce' },
            { label: 'Healthcare', value: 'healthcare' },
            { label: 'Logistics', value: 'logistics' },
            { label: 'Cross-industry', value: 'cross-industry' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'clientName',
      type: 'text',
      admin: {
        condition: (data) => data?.kind === 'client',
        description: 'Shown only if the permission box below is ticked.',
      },
    },
    {
      name: 'clientPermission',
      type: 'checkbox',
      defaultValue: false,
      label: 'The client has agreed in writing to be named',
      admin: {
        condition: (data) => data?.kind === 'client',
        description:
          'Left unticked, the entry publishes with the sector instead of the name — "a manufacturer in the Midlands" rather than the company. Ticking this is a claim that somebody actually agreed.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 320,
      admin: {
        description:
          'One or two sentences. Used as the meta description and on the index card, so write it to be read out of context.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Used on the index card and as the social share image.' },
    },

    {
      name: 'body',
      type: 'blocks',
      minRows: 1,
      admin: {
        description:
          'Add blocks in any order. Images can sit anywhere — between paragraphs, in pairs, or as a gallery.',
      },
      blocks: [
        {
          slug: 'prose',
          labels: { singular: 'Text', plural: 'Text' },
          fields: [
            { name: 'eyebrow', type: 'text', admin: { description: 'Small label above the heading. Optional.' } },
            { name: 'heading', type: 'text' },
            { name: 'text', type: 'richText', required: true },
          ],
        },
        {
          slug: 'featureGrid',
          labels: { singular: 'Feature grid', plural: 'Feature grids' },
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'heading', type: 'text' },
            {
              name: 'items',
              type: 'array',
              minRows: 2,
              maxRows: 8,
              labels: { singular: 'Item', plural: 'Items' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
              ],
            },
            {
              name: 'columns',
              type: 'select',
              defaultValue: '3',
              options: [
                { label: 'Two across', value: '2' },
                { label: 'Three across', value: '3' },
              ],
            },
          ],
        },
        {
          slug: 'steps',
          labels: { singular: 'Numbered steps', plural: 'Numbered steps' },
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'heading', type: 'text' },
            { name: 'intro', type: 'textarea' },
            {
              name: 'items',
              type: 'array',
              minRows: 2,
              maxRows: 10,
              labels: { singular: 'Step', plural: 'Steps' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'detail', type: 'textarea' },
              ],
            },
            { name: 'note', type: 'textarea', admin: { description: 'A line under the steps. Optional.' } },
          ],
        },
        {
          slug: 'imageFull',
          labels: { singular: 'Image (full width)', plural: 'Images (full width)' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
            { name: 'caption', type: 'text' },
            {
              name: 'wide',
              type: 'checkbox',
              label: 'Break out of the text column',
              admin: { description: 'For a dashboard or a wide diagram.' },
            },
          ],
        },
        {
          slug: 'imagePair',
          labels: { singular: 'Two images side by side', plural: 'Two images side by side' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'left', type: 'upload', relationTo: 'media', required: true, admin: { width: '50%' } },
                { name: 'right', type: 'upload', relationTo: 'media', required: true, admin: { width: '50%' } },
              ],
            },
            { name: 'caption', type: 'text' },
          ],
        },
        {
          slug: 'gallery',
          labels: { singular: 'Image gallery', plural: 'Image galleries' },
          fields: [
            {
              name: 'items',
              type: 'array',
              minRows: 2,
              labels: { singular: 'Image', plural: 'Images' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text' },
              ],
            },
            {
              name: 'columns',
              type: 'select',
              defaultValue: '2',
              options: [
                { label: 'Two across', value: '2' },
                { label: 'Three across', value: '3' },
              ],
            },
          ],
        },
        {
          // A left-to-right chain of stages, for an architecture or a data
          // path. Wraps rather than scrolls on a phone. (A block's `admin` has
          // no `description`, so this cannot be said in the editor here; the
          // stages array carries the guidance instead.)
          slug: 'flow',
          labels: { singular: 'Flow diagram', plural: 'Flow diagrams' },
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'heading', type: 'text' },
            { name: 'intro', type: 'textarea' },
            {
              name: 'stages',
              type: 'array',
              minRows: 2,
              labels: { singular: 'Stage', plural: 'Stages' },
              admin: {
                description:
                  'Each stage is one step in a left-to-right chain, joined by arrows. Keep the labels short — they wrap onto several rows on a phone.',
              },
              fields: [{ name: 'label', type: 'text', required: true }],
            },
          ],
        },
        {
          slug: 'quote',
          labels: { singular: 'Pull quote', plural: 'Pull quotes' },
          fields: [
            { name: 'quote', type: 'textarea', required: true },
            {
              type: 'row',
              fields: [
                { name: 'attribution', type: 'text', admin: { width: '50%' } },
                { name: 'role', type: 'text', admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },

    {
      type: 'row',
      fields: [
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '50%', description: 'Pinned to the top of the index.' },
        },
        {
          name: 'publishedAt',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      name: 'noindex',
      type: 'checkbox',
      defaultValue: false,
      label: 'Keep out of search engines',
      admin: {
        position: 'sidebar',
        description: 'For work a client is happy to have on the site but not indexed.',
      },
    },
  ],
};

export default Portfolio;
