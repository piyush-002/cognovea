import type { CollectionConfig } from 'payload';
import { authenticated } from '@/access';
import { toolLeadHooks } from '@/lib/revalidate';

/**
 * Someone who downloaded a summary from a free tool.
 *
 * Deliberately NOT stored in `enquiries`. A person who ran a calculator and
 * wanted the one-pager has not asked to be contacted — they answered a
 * question about their own business and took a document away. Filing that
 * beside people who filled in the contact form would make the enquiries list
 * overstate the pipeline, and the first person to work that list would waste a
 * morning on it.
 *
 * The fields are also different: an enquiry needs a name and a company to be
 * actionable, and this needs an email and their numbers. Asking a downloader
 * for a company name to receive a PDF is friction spent on data nobody uses.
 */
export const ToolLeads: CollectionConfig = {
  slug: 'tool-leads',
  labels: { singular: 'Tool Download', plural: 'Tool Downloads' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'tool', 'status', 'createdAt'],
    group: 'Content',
    description:
      'Email addresses left in exchange for a tool summary. These people asked for a document, not a call — treat them accordingly.',
  },
  access: {
    // No public read, and no public create. The Server Action is the only door,
    // exactly as with enquiries.
    read: authenticated,
    create: () => false,
    update: authenticated,
    delete: authenticated,
  },
  hooks: toolLeadHooks,
  fields: [
    { name: 'email', type: 'email', required: true, index: true },
    {
      name: 'tool',
      type: 'select',
      required: true,
      defaultValue: 'bi-automation-calculator',
      options: [{ label: 'BI Automation Savings Calculator', value: 'bi-automation-calculator' }],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Not a fit', value: 'not-a-fit' },
        { label: 'Spam', value: 'spam' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        readOnly: true,
        description:
          'The figures they entered and what the tool returned. This is the useful part: it is the only place on this site where somebody has volunteered the size of their reporting problem.',
      },
    },
    {
      name: 'shareUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Opens their exact result. Paste it into a browser to see what they saw.',
      },
    },
    { name: 'notes', type: 'textarea' },
  ],
};

export default ToolLeads;
