import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import Calculator from '@/components/calculator/Calculator';
import Methodology from '@/components/calculator/Methodology';
import JsonLd from '@/components/JsonLd';
import { CELL_ERROR_RATE } from '@/lib/calculator/assumptions';
import { pageMetadata } from '@/lib/seo';
import { abs, site } from '@/lib/site';

const PATH = '/tools/bi-automation-calculator';

/**
 * A tool at its own URL, not a blog post with a widget in it.
 *
 * The distinction matters commercially: resource roundups and "free tools"
 * lists link to tools, and they link to the tool's own address. Burying this
 * under /insights would make every link that ever points here point at an
 * article instead.
 */
export const metadata: Metadata = pageMetadata({
  title: 'BI Automation Savings Calculator | Cognovea',
  description:
    'Work out what manual reporting costs your business each year, and what automating it would recover. Free, no sign-up, and every assumption is shown and sourced.',
  path: PATH,
});

const CRUMBS = [
  { href: '/tools', label: 'Tools' },
  { href: PATH, label: 'BI Automation Savings Calculator' },
];

export default function CalculatorPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema(CRUMBS),
          {
            '@context': 'https://schema.org',
            // WebApplication, not Article. It is a thing you use, and the type
            // is what makes it eligible to be surfaced as a tool.
            '@type': 'WebApplication',
            name: 'BI Automation Savings Calculator',
            url: abs(PATH),
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any modern browser',
            description:
              'Estimates the annual cost of manual reporting — time, rework and decision delay — and what automation would recover.',
            isAccessibleForFree: true,
            // Stating the price as zero is not a formality: it is what lets a
            // roundup describe this as a free tool without having to check.
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
            provider: { '@id': `${site.url}/#organization` },
          },
        ]}
      />

      <PageHero
        eyebrow="Free Tool"
        title="What Is Manual Reporting Actually Costing You?"
        crumbs={CRUMBS}
        compact
        intro="Enter what your team does today. The tool works out the annual cost in three parts — the hours, the rework, and how late your decisions are — and what automating it would give back. No sign-up, and every assumption is shown."
      />

      <section className="band">
        <div className="wrap">
          <Calculator />
        </div>
      </section>

      <section className="band band--tint">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Methodology</p>
            <h2 className="h-lg">How This Is Calculated</h2>
          </div>
          <div className="rv">
            <Methodology />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap measure">
          <div className="s-head rv">
            <p className="eyebrow">Why three numbers, not one</p>
            <h2 className="h-md">Hours saved rarely gets a budget approved</h2>
          </div>
          <div className="rich rv">
            <p>
              Most calculators of this kind multiply hours by a rate and stop. That produces a number nobody argues
              with and nobody acts on, because time saved is the easiest saving to dismiss: the people are still
              employed, so where did the money go?
            </p>
            <p>
              So the total is split three ways. The rework figure will usually look small next to the labour one, and
              that is not an accident: it counts only the errors somebody notices and fixes, at a rate of{' '}
              {(CELL_ERROR_RATE.value * 100).toFixed(2)}% of formulas, measured across an audit of 50 working
              spreadsheets. The errors nobody catches are the expensive ones, and we have not estimated them, because
              a number for those would be invented. Read the rework line as a floor rather than a total.
            </p>
            <p>
              The third is left unpriced altogether unless you fill it in. A decision made on data several days old is
              a decision made on a version of the business that no longer exists — in most companies that is the
              largest of the three costs, and it is also the one nobody outside the business can put a figure on. We
              tell you how stale the data is and how often. What a day of that is worth is your number, not ours.
            </p>
            <p>
              That is the honest shape of it: one cost we can measure from what you told us, one we can bound from
              published research, and one only you can value.
            </p>
            <p>
              <Link className="link-arrow" href="/data-health-check">
                A Data Health Check measures this properly
              </Link>
            </p>
          </div>
        </div>
      </section>

      <CtaBand
        title="Want the Real Numbers Instead of an Estimate?"
        body="A two week Data Health Check replaces every assumption on this page with a measurement of your actual reporting, pipelines and data quality, and tells you what to fix first."
        primary={{ href: '/data-health-check', label: 'Book a Data Health Check' }}
        secondary={{ href: '/contact', label: 'Talk to Us' }}
      />
    </>
  );
}
