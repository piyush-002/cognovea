import type { CollectionConfig } from 'payload';
import { authenticated } from '@/access';

/**
 * Contact-form submissions.
 *
 * Note the access control: `create` is **authenticated**, not `anyone`, even
 * though the whole point is that anonymous visitors submit this form. That is
 * deliberate. Opening `create` to the public would also open Payload's REST
 * endpoint, anyone could POST to /api/enquiries directly, in a loop, with no
 * validation beyond the field types.
 *
 * Instead the only way in is the server action in src/actions/enquiry.ts, which
 * validates first and then writes with `overrideAccess: true`. One entrance,
 * and it is one we control.
 */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['companyName', 'fullName', 'workEmail', 'status', 'createdAt'],
    group: 'Content',
    description: 'Submissions from the contact form.',
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      required: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Closed', value: 'closed' },
        { label: 'Spam', value: 'spam' },
      ],
    },
    {
      name: 'intent',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Which form on the site this came from.',
      },
    },
    { name: 'fullName', type: 'text', required: true },
    { name: 'workEmail', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'companyName', type: 'text', required: true },
    { name: 'companySize', type: 'text' },
    { name: 'industry', type: 'text' },
    {
      name: 'hardestNumber',
      type: 'text',
      label: 'Hardest number to trust',
    },
    { name: 'goal', type: 'textarea', label: 'What they want to achieve' },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes. Not visible to the sender.' },
    },
  ],
  timestamps: true,
};

export default Enquiries;
