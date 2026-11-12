/**
 * Which story the site tells: AI first, or data first.
 *
 * Cognovea has always done both, and the site has always said so. What it has
 * never done is decide which one is the subject of the sentence. Today data is:
 * the tagline is "Where Data Becomes Intelligence", every homepage section
 * heading leads with data, and AI arrives as the outcome. A visitor's first
 * impression is a data engineering firm that also does AI.
 *
 * This file holds both versions of every line that carries that impression, so
 * the two can be read side by side and switched with one environment variable
 * rather than a search-and-replace across a dozen components.
 *
 *   NEXT_PUBLIC_POSITIONING=ai   in .env.local, or on a Vercel preview
 *
 * It defaults to 'data', which is what the site says today. Merging this
 * changes nothing until somebody sets the variable, which is the point: the
 * switch is a deployment decision, not a code one.
 *
 * WHAT THIS DELIBERATELY DOES NOT TOUCH: the service pages' own titles.
 * "SAP Data Migration & S/4HANA Data Readiness" and "SCADA & Historian Data
 * Analytics" are titled to match what a buyer types into a search box. Nobody
 * searches for AI-powered SCADA migration, and forcing the brand narrative into
 * those titles would make them worse at the only job they have. A company can
 * be an AI company whose SAP page is called the SAP page.
 *
 * This is scaffolding with a shelf life. Once the choice is settled, the honest
 * thing is to delete this file and inline the winner — a permanent flag means
 * every narrative string exists twice forever, and every test runs twice.
 */
export type Positioning = 'data' | 'ai';

/** Anything other than an explicit 'ai' means the site it is today. */
export const POSITIONING: Positioning = process.env.NEXT_PUBLIC_POSITIONING === 'ai' ? 'ai' : 'data';

export type Voice = {
  /** Brand line. Appears in JSON-LD slogan and the llms.txt summary. */
  tagline: string;
  /** The lockup's second line, under the wordmark. On every page, twice. */
  logoTag: string;
  /** site.description: JSON-LD, and the fallback meta description. */
  siteDescription: string;
  footerBlurb: string;
  home: {
    /** <title> and meta description for the home page itself. */
    title: string;
    description: string;
    eyebrow: string;
    /** The h1 splits so the last phrase can carry the gradient. */
    h1Lead: string;
    h1Accent: string;
    sub: string;
    lede: string;
    /** The five section headings, keyed by what the section is about rather
        than by position, so reordering later does not rename anything. */
    possible: string;
    build: string;
    path: string;
    understands: string;
    insights: string;
  };
  /** Nav order for What We Do, by href. Anything unlisted keeps its place. */
  serviceOrder: string[];
};

const DATA: Voice = {
  tagline: 'Where Data Becomes Intelligence.',
  logoTag: 'Data + AI Solutions',
  siteDescription:
    'Cognovea turns enterprise data into intelligence. Data analytics, business intelligence, data engineering and AI solutions that drive data-driven decision making.',
  footerBlurb:
    'Where data becomes intelligence. Data engineering, analytics, business intelligence and AI for growing enterprises.',
  home: {
    title: 'Cognovea | Data Analytics and AI Solutions',
    description:
      'Cognovea turns enterprise data into intelligence. Data analytics, business intelligence, data engineering and AI solutions that drive data-driven decision making.',
    eyebrow: 'Data + AI Solutions',
    h1Lead: 'Where Data Becomes ',
    h1Accent: 'Intelligence.',
    sub: 'Data Depth. AI Power. Real Impact.',
    lede:
      'When data is transformed into intelligence, and intelligence is transformed into impact, the trajectory of an organization changes. Through the power of data analytics and robust enterprise data analytics, we unlock the hidden potential within your systems to drive tangible business value. Beyond simply analyzing and processing data, Cognovea converts complex insights into meaningful results that fuel sustainable growth and competitive advantage.',
    possible: 'What Becomes Possible When Your Data Starts Working Together',
    build: 'From Data to Decisions, We Build What Makes Intelligence Possible',
    path: 'A Practical Path Moving From Possibility to Progress',
    understands: 'Intelligence That Understands the Business Behind the Data',
    insights: 'Floating Ideas for the Data-Driven Enterprise.',
  },
  serviceOrder: [],
};

const AI: Voice = {
  tagline: 'AI, Built on Data That Holds Up.',
  logoTag: 'AI + Data Solutions',
  siteDescription:
    'Cognovea builds AI that works in production: generative AI, AI agents and predictive systems, on data engineering solid enough to run them. AI and data consulting for manufacturers and energy operators.',
  footerBlurb:
    'AI, built on data that holds up. AI strategy, generative AI and predictive systems, with the data engineering underneath them.',
  home: {
    title: 'Cognovea | AI Solutions Built on Data That Holds Up',
    description:
      'Cognovea builds AI that survives contact with production: generative AI, agents and predictive systems, on data engineering solid enough to run them. AI consulting for manufacturers and energy operators.',
    eyebrow: 'AI + Data Solutions',
    h1Lead: 'AI, Built on Data That ',
    h1Accent: 'Holds Up.',
    sub: 'AI Power. Data Depth. Real Impact.',
    /* Deliberately concrete about the failure it avoids. Most AI pitches are
       written as though the model were the hard part; in an industrial estate
       it almost never is, and saying so is what separates this from every other
       AI page a plant director has read this quarter. */
    lede:
      'Most AI projects do not fail because the model was wrong. They fail because the data underneath it could not carry the question being asked of it. Cognovea builds both halves: the generative AI, agents and predictive systems that change what a business can decide, and the data engineering that makes them work on your systems rather than in a demo. That is why our AI reaches production, and stays there.',
    possible: 'What Becomes Possible When AI Runs on Data You Trust',
    build: 'From Models to Decisions, We Build What Makes AI Work',
    path: 'A Practical Path From AI Ambition to Working Systems',
    understands: 'AI That Understands the Business, Not Just the Numbers',
    insights: 'Floating Ideas for the AI-Ready Enterprise.',
  },
  /* AI pages first. The rest keep their existing order behind them. */
  serviceOrder: ['/ai-strategy-consulting', '/generative-ai-services'],
};

export const voice: Voice = POSITIONING === 'ai' ? AI : DATA;

/**
 * Reorders nav links so the ones the current positioning leads with come first.
 * Stable for everything unlisted, so the data variant is a no-op.
 */
export function byPositioning<T extends { href: string }>(links: T[]): T[] {
  const rank = (href: string) => {
    const i = voice.serviceOrder.indexOf(href);
    return i === -1 ? voice.serviceOrder.length : i;
  };
  return [...links].sort((a, b) => rank(a.href) - rank(b.href));
}
