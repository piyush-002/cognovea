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

/*
 * Each link defined once, then composed into the three places they appear.
 * The top nav shows a shorter list than the footer, and deriving both from one
 * set of objects is what stops a label being changed in one and not the other.
 */
const TOOLS: NavLink = {
  href: '/tools',
  label: 'Free Tools',
  blurb: 'Calculators that put a number on what your reporting costs.',
};
const PLAYBOOKS: NavLink = {
  href: '/playbooks',
  label: 'Industry Playbooks',
  blurb: 'What AI is actually used for in your sector, and what each needs.',
};
const PORTFOLIO: NavLink = {
  href: '/portfolio',
  label: 'Portfolio',
  blurb: 'Products we have built, and client work we can show.',
};
const INSIGHTS: NavLink = { href: '/insights', label: 'Insights' };
const CONTACT: NavLink = { href: '/contact', label: 'Contact' };
const ABOUT: NavLink = {
  href: '/about-us',
  label: 'About Us',
  blurb: 'Who we are, how we work, and where we are.',
};
const CAREERS: NavLink = {
  href: '/careers',
  label: 'Careers',
  blurb: 'Open data and AI roles, and what the work looks like.',
};

/**
 * Grouped under a Resources dropdown in the top nav.
 *
 * Both are ungated assets that exist to be linked to, and they belong together
 * for the visitor's sake: somebody who wants the calculator and somebody who
 * wants the manufacturing playbook are the same person at different points, and
 * neither knows to look for the other under a label naming only one of them.
 *
 * Folding them in also keeps the top row short. There will be six playbooks and
 * more than one tool before long, and the alternative is a row that grows by one
 * every time an asset ships.
 */
export const navResourceLinks: NavLink[] = [TOOLS, PLAYBOOKS];

/** Shown flat in the top nav, after the dropdowns. */
export const navPrimaryLinks: NavLink[] = [INSIGHTS, CONTACT];

/**
 * Grouped under a Company dropdown in the top nav.
 *
 * About and Careers are the two nobody arrives looking for — a visitor comes
 * for the work, the tools or a conversation, and finds these once they are
 * already interested. Folding them in takes the top row from seven items to
 * five, which is the difference between a row you scan and one you read.
 */
export const navCompanyLinks: NavLink[] = [PORTFOLIO, ABOUT, CAREERS];

/**
 * Everything, in reading order, for the footer and the mobile drawer. Both have
 * the room, and a footer is where people go when the nav did not have it.
 */
export const companyLinks: NavLink[] = [TOOLS, PLAYBOOKS, INSIGHTS, PORTFOLIO, ABOUT, CAREERS, CONTACT];

/* The mobile drawer, split the way the desktop nav is. Filing a playbook under
   "Company" was near enough when that group was About and Careers; it is not
   now. */
export const drawerResourceLinks: NavLink[] = [TOOLS, PLAYBOOKS, INSIGHTS];
export const drawerCompanyLinks: NavLink[] = [PORTFOLIO, ABOUT, CAREERS, CONTACT];

/**
 * Certifications shown in the footer.
 *
 * `logo` is optional. When it is set the mark is rendered; when it is not, the
 * name is rendered as a text chip. That fallback is not a placeholder waiting to
 * be replaced with any image — it is what should be shown until the *right*
 * image exists, because the right image is not downloadable.
 *
 * There is no such thing as an "ISO 27001 logo" to fetch. ISO does not certify
 * anyone and forbids use of its own logo to advertise certification. What a
 * certified organisation may display is the certification mark issued by the
 * body that audited it — BSI, TÜV, DNV, Bureau Veritas, Intertek or similar —
 * supplied as an artwork pack with rules attached, usually including that the
 * certificate number appears with it. The CMMI badge is licensed by ISACA to
 * organisations holding a current appraisal, and they supply that artwork too.
 *
 * A generic badge taken off the web is a trademark problem and, to any buyer who
 * knows this, a signal that the certification may not be real. So: the files
 * come from the certification body, and until they do, these stay as words.
 */
export type Certification = {
  name: string;
  /** The certifying body. Not the standard's author — ISO certifies nobody. */
  body?: string;
  /** Certificate number, or the appraisal ID for CMMI. */
  ref?: string;
  /**
   * Path under /public to the mark supplied by the certification body.
   * Rendered at the height set in CSS; supply at 2x that or better.
   */
  logo?: string;
  /** Height in pixels of the supplied file, so the browser can reserve space. */
  logoHeight?: number;
  /** Width in pixels of the supplied file. */
  logoWidth?: number;
};

export const certifications: Certification[] = [
  { name: 'ISO/IEC 27001', logo: '/img/cert-iso-27001.png', logoWidth: 168, logoHeight: 168 },
  { name: 'ISO 9001', logo: '/img/cert-iso-9001.png', logoWidth: 167, logoHeight: 168 },
  { name: 'CMMI Level 3', logo: '/img/cert-cmmi-3.png', logoWidth: 242, logoHeight: 168 },
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
  // Same reasoning as the calculator: these exist to be linked to, so they
  // outrank the pages that exist to be found.
  { path: '/playbooks', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/portfolio', priority: 0.8, changeFrequency: 'monthly' },
  // Individual playbooks are not listed here. They are derived from the content
  // module in sitemap.ts, so publishing one cannot leave it out of the sitemap
  // by omission — which a hand-maintained list guarantees eventually.
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
