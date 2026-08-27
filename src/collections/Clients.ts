import type { CollectionConfig } from 'payload';
import { authenticated, publishedOrAuthenticated } from '@/access';
import { marketingHooks } from '@/lib/revalidate';

/**
 * Client logos.
 *
 * Note the `permission` field. Displaying a client's mark on your own marketing
 * site is their trademark being used to promote you, and enterprise contracts
 * frequently forbid it without written sign-off. It is an easy thing to forget
 * once and an awkward thing to be asked about later, so the record cannot be
 * saved until someone has confirmed it.
 */
export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Client Logo', plural: 'Client Logos' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'featured', 'order', '_status'],
    group: 'Content',
    description: 'Logos shown in the client strip. Nothing appears on the site until one is published.',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: true },
  // Publishing rebuilds the pages that show this content, so an editor
  // sees the change on the site rather than waiting out the revalidate.
  hooks: marketingHooks,
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'SVG is best: it stays sharp at any size and weighs almost nothing. Otherwise a PNG with a transparent background, at least 400px wide.',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: { description: 'Optional. If set, the logo links here.' },
    },
    {
      name: 'permission',
      type: 'checkbox',
      label: 'We have permission to display this logo',
      admin: {
        position: 'sidebar',
        description: 'Check your engagement contract before ticking this. Many forbid logo use without written consent.',
      },
      validate: (value: unknown) =>
        value === true || 'Confirm you have permission to display this client logo before saving.',
    },
    {
      name: 'scale',
      type: 'number',
      defaultValue: 1,
      min: 0.5,
      max: 2,
      admin: {
        position: 'sidebar',
        step: 0.05,
        description:
          'Optical size, 1 is normal. Raise it when a logo looks small next to the others, which usually means the file has transparent space around the mark. Trimming that space in the file is the better fix; this is for when you cannot.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Show in the homepage strip.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
};

export default Clients;
