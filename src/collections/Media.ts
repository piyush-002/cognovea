import type { CollectionConfig } from 'payload';
import { anyone, authenticated } from '@/access';

/**
 * Uploads. Sizes are generated on upload so `next/image` can serve a sensibly
 * sized file rather than shrinking a 4000px original in the browser, which is
 * one of the most common causes of a poor LCP on an otherwise fast site.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    // Used only when no blob token is configured (i.e. local development).
    staticDir: 'public/uploads',
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 900 },
      { name: 'hero', width: 1600 },
      // Matches the OG image dimensions used across the site.
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe what the image shows, for screen readers and for search. Leave a purely decorative image described as "Decorative".',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Optional. Shown under the image where the layout supports it.' },
    },
  ],
};

export default Media;
