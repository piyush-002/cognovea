import type { FaqItem } from '@/lib/schema';

/**
 * The shape of a service page.
 *
 * These pages exist because the sales catalogue is far larger than the site:
 * twelve fixed-scope Outcomes, eight capacity models, sixteen capability lines,
 * eight industries and seven platforms, against five service pages. The gap was
 * being closed in email, which is where a link that does not exist costs a deal.
 *
 * They are data rather than hand-written TSX for one reason: the alternative was
 * five near-identical 500-line page files, and the fifth would have drifted from
 * the first within a month. A section here is a shape plus its content, and the
 * template owns every decision about how a shape is drawn — so a change to how
 * comparison tables look happens once, not five times.
 *
 * What is deliberately NOT in this type: anything about price. Pricing, data
 * residency, IP and security certification go through Piyush before they go on a
 * page, and a field here would invite someone to fill it in.
 */
export type ServiceSection =
  | { kind: 'prose'; eyebrow: string; heading: string; lede?: string; body: string[] }
  | {
      kind: 'cards';
      eyebrow: string;
      heading: string;
      lede?: string;
      /** Three reads best at this width; two is right for longer bodies. */
      cols?: 2 | 3;
      cards: { title: string; body: string }[];
    }
  | {
      kind: 'steps';
      eyebrow: string;
      heading: string;
      lede?: string;
      /** Numbered because these genuinely happen in order. */
      steps: { title: string; body: string }[];
    }
  | {
      kind: 'table';
      eyebrow: string;
      heading: string;
      lede?: string;
      /** Read by screen readers in place of the visual heading row. */
      caption: string;
      head: string[];
      rows: string[][];
      /** Which column carries the answer, and gets marked as such. */
      markColumn?: number;
    };

export type Service = {
  /** Route, without slashes. The URL is deliberately flat, matching the existing
      service pages: /sap-data-migration-services, not /services/sap/... */
  slug: string;
  /** Verbatim <title>. Kept under 62 characters so search results do not clip it. */
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  standfirst: string;
  /** The one line a salesperson would say. Sits under the standfirst. */
  promise: string;
  image: { src: string; alt: string };
  sections: ServiceSection[];
  faq: FaqItem[];
  /** Pages a reader of this one plausibly wants next. Also the internal linking
      that makes the industry pages worth building at all. */
  related: { href: string; label: string; blurb: string }[];
};
