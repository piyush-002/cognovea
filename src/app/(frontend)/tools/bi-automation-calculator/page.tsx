import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand, PageHero, breadcrumbSchema } from '@/components/Bits';
import Faq from '@/components/Faq';
import Calculator from '@/components/calculator/Calculator';
import Methodology from '@/components/calculator/Methodology';
import JsonLd from '@/components/JsonLd';
import { CELL_ERROR_RATE } from '@/lib/calculator/assumptions';
import { faqSchema, type FaqItem } from '@/lib/schema';
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
/*
 * The title carries the phrase people type. Searches in this space cluster on
 * "automation ROI calculator" and "cost of manual reporting calculator"; the
 * previous title, "BI Automation Savings Calculator", used a phrase nobody
 * queries and put the brand where a keyword should be.
 *
 * "Free" earns its place rather than padding: it is the word that gets a tool
 * into a resource roundup, and the qualifier a reader scans for before deciding
 * whether clicking will cost them an email address.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Manual Reporting Cost Calculator | Free ROI Tool',
  description:
    'Work out what manual reporting costs your business a year — the hours, the rework and the cost of late decisions — and what automating it would recover. Free, no sign-up, every assumption sourced.',
  path: PATH,
});

/**
 * Questions phrased the way people ask them, answered in full sentences that
 * stand on their own.
 *
 * This is the part an answer engine can lift. A model summarising "how do you
 * calculate the cost of manual reporting" needs a self-contained paragraph with
 * the method in it and a source attached; a page that only makes sense while
 * you are looking at the widget gives it nothing to quote. Every figure below
 * carries its citation for the same reason — an uncited number is one an engine
 * has no reason to repeat and a reader has no reason to trust.
 */
const FAQS: FaqItem[] = [
  {
    q: 'How do you calculate the cost of manual reporting?',
    a: 'Multiply the number of people doing the reporting by the hours each spends on it a week, then by the working weeks in a year, then by their fully loaded hourly cost. Cognovea uses 46 working weeks rather than 52, allowing for leave and public holidays. That gives the labour cost. Two further costs sit underneath it: rework, where a report is found to be wrong and built again, and the cost of decisions taken on data that is already several days old.',
  },
  {
    q: 'How many spreadsheet reports contain errors?',
    a: 'An audit of 50 operational spreadsheets by Powell, Baker and Lawson, published in the Journal of Organizational and End User Computing in 2009, examined 270,722 formulas and found 483 errors. 0.87% of formulas produced a wrong result under their restrictive definition, and 94% of the spreadsheets audited contained at least one error. This calculator uses the 0.87% figure, which counts only errors somebody catches and redoes.',
  },
  {
    q: 'How much time does automating reporting actually save?',
    a: 'It depends entirely on how consistent the source systems are, so this calculator asks rather than assumes: the reduction is a slider you set, defaulting to 60%, which is the conservative end of what pipeline and reporting automation typically removes. What survives automation is exception handling, interpretation and the judgement calls a person still has to make. Any vendor quoting a single percentage for this is quoting a sales figure, not a measurement.',
  },
  {
    q: 'What does it cost when decisions are made on stale data?',
    a: 'Nobody outside your business can answer that, and this calculator does not pretend to. It reports the finding — how many working days old your data is when someone acts on it, and how often that happens a year — and converts it to money only if you supply what a day of delay is worth to you. A day of stale stock data costs a retailer something entirely unlike what it costs a hospital.',
  },
  {
    q: 'Is this calculator free, and does it need an email address?',
    a: 'It is free and nothing is gated. There is no sign-up, no email capture and no account. You can also share a result as a link, which carries your numbers so the person who opens it sees your figures rather than an empty form.',
  },
  {
    q: 'Where do the numbers in this calculator come from?',
    a: 'Every figure is either something you entered or one of four disclosed assumptions, each labelled as published research, our own position, or your figure. The methodology panel on this page lists all of them with sources. There are deliberately no industry benchmarks: no credible published figures exist for reporting hours by sector, so the industry selector changes the wording and nothing about the arithmetic.',
  },
];

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
          // Built from the same array the page renders, so the markup and the
          // visible answers cannot drift apart.
          faqSchema(FAQS),
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
        eyebrow="Free Tool · No Sign-Up"
        title="Manual Reporting Cost Calculator"
        crumbs={CRUMBS}
        compact
        intro="Work out what your team's recurring reporting costs a year — the hours, the rework, and the price of decisions made on stale data — and what automating it would give back. Nothing is gated and every assumption is shown and sourced."
      />

      <section className="band">
        <div className="wrap">
          {/* The short answer, before the tool.
              A calculator page that only makes sense while you are using it
              gives an answer engine nothing to quote and a hurried reader
              nothing to take away. This states the method in full sentences
              that stand alone, which is what gets cited. */}
          <div className="answer rv">
            <h2 className="h-sm">The short version</h2>
            <p>
              To work out what manual reporting costs you a year: multiply the people doing it by the hours each
              spends a week, by 46 working weeks, by their fully loaded hourly cost. Add the rework — roughly{' '}
              {(CELL_ERROR_RATE.value * 100).toFixed(2)}% of spreadsheet formulas produce a wrong result, from an
              audit of 50 operational spreadsheets covering 270,722 formulas — and add what it costs you when
              decisions wait on data that is already days old.
            </p>
            <p>
              The calculator below does that arithmetic on your figures and splits the total three ways, so you can
              see which part is worth acting on. It is free, nothing is gated, and every assumption it makes is listed
              with its source further down this page.
            </p>
          </div>

          <Calculator />
        </div>
      </section>

      <section className="band band--tint" id="methodology">
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

      <section className="band" id="questions">
        <div className="wrap">
          <div className="s-head rv">
            <p className="eyebrow">Questions</p>
            <h2 className="h-lg">Working Out the Cost of Manual Reporting</h2>
          </div>
          <div className="rv">
            <Faq items={FAQS} />
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
