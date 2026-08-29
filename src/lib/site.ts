import { CANONICAL_URL } from './host-redirect.mjs';
/**
 * Single source of truth for site-wide values: URLs, contact details, nav.
 * Change the domain here once and canonicals, sitemap, robots and JSON-LD follow.
 */

export const site = {
  name: 'Cognovea',
  tagline: 'Where Data Becomes Intelligence.',
  /* Imported, not restated. next.config.mjs needs the same value for the www
     redirect and cannot import a .ts module, so it lives in host-redirect.mjs
     and both read it from there. Two copies of this string is exactly the bug
     being fixed: canonicals said the apex while every real URL was www. */
  url: CANONICAL_URL,
  description:
    'Cognovea turns enterprise data into intelligence. Data analytics, business intelligence, data engineering and AI solutions that drive data-driven decision making.',
  email: 'hello@cognovea.com',
  phones: ['+91 98937 38323', '+91 99242 99318'],
  locations: {
    hq: {
      label: 'Bangalore, Karnataka, India',
      role: 'Headquarters',
      address: 'Flat 202, 2nd Floor, 16th Cross, 17th Main, Sector 4, HSR Layout',
      locality: 'Bengaluru',
      region: 'KA',
      postalCode: '560102',
      country: 'IN',
    },
    dev: {
      label: 'Indore, Madhya Pradesh, India',
      role: 'Development Center',
      address: '101, Kanchan Sagar, 18/1, Near Industry House, Old Palasia',
      locality: 'Indore',
      region: 'MP',
      postalCode: '452001',
      country: 'IN',
    },
  },
  // TODO: replace with the official profiles Cognovea actively maintains.
  social: {
    linkedin: '',
    instagram: '',
    facebook: '',
    youtube: '',
    x: '',
  },
} as const;

export type NavLink = {
  href: string;
  label: string;
  blurb?: string;
};

export const serviceLinks: NavLink[] = [
  {
    href: '/data-engineering-services',
    label: 'Data Engineering Services',
    blurb: 'Cloud warehouses, pipelines, governance and dedicated pods.',
  },
  {
    href: '/data-modernization-services',
    label: 'Data Modernization Services',
    blurb: 'Move off legacy systems onto a modern, AI-ready cloud stack.',
  },
  {
    href: '/generative-ai-services',
    label: 'Generative AI Services',
    blurb: 'RAG, conversational BI, AI agents and document automation.',
  },
  {
    href: '/ai-strategy-consulting',
    label: 'AI Strategy & Consulting',
    blurb: 'Readiness, use-case discovery, roadmap and governance.',
  },
];

export const companyLinks: NavLink[] = [
  { href: '/tools', label: 'Free Tools' },
  { href: '/insights', label: 'Insights' },
  { href: '/about-us', label: 'About Us' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
];

export const legalLinks: NavLink[] = [{ href: '/privacy-policy', label: 'Privacy Policy' }];

/** Every indexable route, used to generate sitemap.xml. */
export const routes: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/data-engineering-services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/data-modernization-services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/generative-ai-services', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/ai-strategy-consulting', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/data-health-check', priority: 0.9, changeFrequency: 'monthly' },
  // The calculator is a link target in its own right, so it ranks above the
  // blog: it is the page other sites are meant to point at.
  { path: '/tools', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/tools/bi-automation-calculator', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/insights', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/about-us', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
];

/** Absolute URL helper, keeps canonicals and JSON-LD consistent. */
export function abs(path: string): string {
  if (path === '/') return `${site.url}/`;
  return `${site.url}${path}/`;
}
