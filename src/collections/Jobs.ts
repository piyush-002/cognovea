import type { CollectionConfig } from 'payload';
import { authenticated, publishedOrAuthenticated } from '@/access';
import { slugField } from '@/fields/slug';
import { jobHooks } from '@/lib/revalidate';

/**
 * Job openings for the careers page.
 *
 * The field names and option values are chosen to map cleanly onto schema.org
 * JobPosting, which is what makes a listing eligible for the Google Jobs
 * results box. That is a genuinely large source of qualified traffic for a
 * services company, and it is the reason `validThrough` is required: Google
 * demotes and eventually drops postings with no expiry, so leaving it optional
 * would quietly degrade the listings over time.
 */
export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Job Opening', plural: 'Job Openings' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'department', 'validThrough', '_status'],
    group: 'Content',
    description: 'Openings listed on /careers.',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: true, maxPerDoc: 10 },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 120 },
    slugField('title'),
    {
      name: 'department',
      type: 'select',
      required: true,
      options: [
        { label: 'Data Engineering', value: 'data-engineering' },
        { label: 'Analytics & BI', value: 'analytics-bi' },
        { label: 'AI & Machine Learning', value: 'ai-ml' },
        { label: 'Consulting & Strategy', value: 'consulting' },
        { label: 'Design', value: 'design' },
        { label: 'Operations', value: 'operations' },
      ],
    },
    {
      name: 'employmentType',
      type: 'select',
      required: true,
      defaultValue: 'FULL_TIME',
      // These exact values are what schema.org JobPosting expects.
      options: [
        { label: 'Full time', value: 'FULL_TIME' },
        { label: 'Part time', value: 'PART_TIME' },
        { label: 'Contract', value: 'CONTRACTOR' },
        { label: 'Internship', value: 'INTERN' },
        { label: 'Temporary', value: 'TEMPORARY' },
      ],
    },
    {
      name: 'workplace',
      type: 'select',
      required: true,
      defaultValue: 'onsite',
      options: [
        { label: 'On site', value: 'onsite' },
        { label: 'Hybrid', value: 'hybrid' },
        { label: 'Remote', value: 'remote' },
      ],
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        { name: 'city', type: 'text', required: true, defaultValue: 'Bengaluru' },
        { name: 'region', type: 'text', required: true, defaultValue: 'Karnataka' },
        { name: 'country', type: 'text', required: true, defaultValue: 'IN' },
      ],
      admin: {
        condition: (data) => data?.workplace !== 'remote',
        description: 'Where the role is based. Hidden for fully remote roles.',
      },
    },
    {
      name: 'experience',
      type: 'text',
      admin: { description: 'For example "3–6 years". Shown on the listing card.' },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'One or two sentences, shown on the careers page listing.' },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: { description: 'The full role description, responsibilities and requirements.' },
    },
    {
      name: 'validThrough',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description:
          'The date this posting stops being valid. Required: search engines drop postings with no expiry, and expired roles are hidden from the site automatically.',
      },
    },
    {
      name: 'applyEmail',
      type: 'email',
      required: true,
      defaultValue: 'careers@cognovea.com',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData?._status === 'published' && !value) return new Date();
            return value;
          },
        ],
      },
    },
  ],
  // Publishing a role rebuilds the careers page immediately rather than after
  // the revalidate window, which matters most when a role is closed.
  hooks: jobHooks,
};

export default Jobs;
