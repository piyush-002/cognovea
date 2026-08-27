import type { GlobalConfig } from 'payload';
import { anyone, authenticated } from '@/access';
import { siteSettingsHooks } from '@/lib/revalidate';

/**
 * Site-wide values that currently live as constants in `src/lib/site.ts`.
 *
 * Read `src/lib/settings.ts` before wiring this into more pages. It explains
 * why the ten marketing pages still read the constants rather than this global,
 * and what has to be true before that changes.
 *
 * Worth noting while you are in here: there are three known mismatches between
 * your source documents and what cognovea.com currently shows. The slogan, the
 * contact email, and whether Indore is a "Development Center" or a "Delivery
 * Centre". Whichever you decide is correct, this is where it should end up.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Admin', description: 'Contact details, offices and social profiles.' },
  access: { read: anyone, update: authenticated },
  // These values sit in the header and footer of every page.
  hooks: siteSettingsHooks,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact',
          fields: [
            { name: 'email', type: 'email', required: true },
            {
              name: 'phones',
              type: 'array',
              maxRows: 4,
              fields: [{ name: 'number', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Offices',
          fields: [
            {
              name: 'offices',
              type: 'array',
              fields: [
                {
                  name: 'role',
                  type: 'text',
                  required: true,
                  admin: { description: 'For example "Headquarters" or "Development Center".' },
                },
                { name: 'label', type: 'text', required: true },
                { name: 'address', type: 'textarea', required: true },
                { name: 'locality', type: 'text', required: true },
                { name: 'region', type: 'text', required: true },
                { name: 'postalCode', type: 'text', required: true },
                { name: 'country', type: 'text', required: true, defaultValue: 'IN' },
              ],
            },
          ],
        },
        {
          label: 'Social',
          description: 'Only fill in profiles that are actually live. Empty ones are not rendered.',
          fields: [
            { name: 'linkedin', type: 'text' },
            { name: 'instagram', type: 'text' },
            { name: 'facebook', type: 'text' },
            { name: 'youtube', type: 'text' },
            { name: 'x', type: 'text', label: 'X (Twitter)' },
          ],
        },
      ],
    },
  ],
};

export default SiteSettings;
