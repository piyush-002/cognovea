import type { CollectionConfig } from 'payload';
import { authenticated, publishedOrAuthenticated } from '@/access';

/**
 * Client testimonials.
 *
 * `services` lets a quote be targeted: a data engineering page asks for a data
 * engineering testimonial and only falls back to a general one if there is no
 * match. A generic quote beside specific copy reads as filler.
 *
 * As with logos, `permission` blocks saving. Publishing a named person's words
 * and job title is personal data under the DPDP Act, and "they said it in an
 * email once" is not the same as agreeing to appear on a public website.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'companyName', 'featured', '_status'],
    group: 'Content',
    description: 'Quotes from clients. Nothing appears on the site until one is published.',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: true },
  defaultSort: 'order',
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      maxLength: 600,
      admin: {
        description:
          'Their words, not ours. Two or three sentences reads better than a paragraph. Do not add quotation marks, the design supplies them.',
      },
    },
    { name: 'authorName', type: 'text', required: true },
    {
      name: 'authorRole',
      type: 'text',
      admin: { description: 'For example "Head of Data". A role makes a quote far more credible than a name alone.' },
    },
    {
      name: 'companyName',
      type: 'text',
      admin: { description: 'Written out. Leave blank if the client prefers not to be named.' },
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      admin: {
        description: 'Optional. Links the quote to a client logo so their mark can appear beside it.',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional headshot. A square crop works best.' },
    },
    {
      name: 'services',
      type: 'select',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Which pages this quote suits. Leave empty for a general quote usable anywhere.',
      },
      options: [
        { label: 'Data Engineering', value: 'data-engineering-services' },
        { label: 'Data Modernization', value: 'data-modernization-services' },
        { label: 'Generative AI', value: 'generative-ai-services' },
        { label: 'AI Strategy', value: 'ai-strategy-consulting' },
        { label: 'Data Health Check', value: 'data-health-check' },
      ],
    },
    {
      name: 'permission',
      type: 'checkbox',
      label: 'This person agreed to be quoted publicly',
      admin: {
        position: 'sidebar',
        description: 'Their name, role and employer become public. Get that in writing.',
      },
      validate: (value: unknown) =>
        value === true || 'Confirm the person agreed to be quoted publicly before saving.',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Eligible for the homepage.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
};

export default Testimonials;
