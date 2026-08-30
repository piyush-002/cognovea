import configPromise from '@payload-config';
import { getPayload } from 'payload';
import type { Portfolio } from '@/payload-types';

/**
 * Puts the PredictX page into the Portfolio collection.
 *
 *   npx payload run src/seed/predictx.ts
 *
 * `payload run` is used rather than a plain node script because it loads the
 * config and resolves the @/ aliases, which a bare .mjs cannot.
 *
 * Idempotent: it looks for the slug first and updates rather than duplicating,
 * so it is safe to run again after editing this file. It will overwrite changes
 * made in the admin, though — once the entry is live, edit it there and treat
 * this script as the thing that created it rather than the thing that owns it.
 *
 * The content is transcribed from the PredictX document, wording unchanged.
 * Nothing is added: the document has no client, no results and no screenshots,
 * so this entry has none either. The dashboard images it refers to can be
 * uploaded in the admin and dropped into the body wherever they belong.
 */

/**
 * A minimal Lexical document from plain paragraphs.
 *
 * The return type is taken from the generated field rather than inferred:
 * Lexical's `format` is a union of alignment keywords, and a bare '' widens to
 * `string` and fails to match it.
 */
type Prose = Extract<NonNullable<Portfolio['body']>[number], { blockType: 'prose' }>;

function rich(...paragraphs: string[]): Prose['text'] {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  };
}

const SLUG = 'predictx';

/*
 * Typed from the generated collection rather than inferred. Without the
 * annotation every `blockType` widens to `string` and none of the blocks match
 * their union member, which produces a page of type errors pointing at the
 * array rather than at the one field that is wrong.
 */
const body: Portfolio['body'] = [
  {
    blockType: 'prose',
    eyebrow: 'The challenge',
    heading: 'The Predictive Maintenance Challenge in Manufacturing',
    text: rich(
      'Manufacturing plants that run hundreds to thousands of interconnected assets face a widening gap between the volume of machine and process data available and the reliability-engineering capacity to act on it. Four challenges make unplanned downtime difficult to prevent with conventional tools.',
    ),
  },
  {
    blockType: 'featureGrid',
    columns: '2',
    items: [
      {
        title: 'Fragmented, low-trust data',
        body: 'PLC/SCADA, IoT condition-monitoring, historian, MES, CMMS/EAM, SAP PM and ERP data sit in disconnected OT and IT systems with inconsistent tags, gaps and manual overrides, so engineers must reconcile numbers before analysis can begin, eroding confidence in the resulting insight.',
      },
      {
        title: 'Equipment failures are detected too late',
        body: 'Fixed-threshold alarms trigger only after a variable crosses a limit, near the end of the P-F interval when only emergency repair remains. Early, multivariate degradation signatures in vibration, temperature, motor current and lubrication stay below alarm thresholds and go undetected for days or weeks.',
      },
      {
        title: 'Interval-based maintenance drifts from reality',
        body: 'Calendar-, run-hour-, cycle- or OEM-interval-based preventive maintenance applies one fixed schedule to every asset, regardless of how hard each one runs. Because identical machines degrade at different rates, fixed intervals cause both over-maintenance — wasted component life and maintenance-induced faults — and unplanned failures between scheduled windows.',
      },
      {
        title: 'Maintenance priority is not business priority',
        body: 'A plant generates hundreds of alarms and notifications, yet static FMEA/RPN scores rarely reflect the current schedule or consequence. Teams need to weigh safety, quality, production, environment and maintenance cost together to identify which failure matters most at any given time.',
      },
    ],
  },
  {
    blockType: 'prose',
    eyebrow: 'The solution',
    heading: 'An AI-Powered Predictive Maintenance Platform',
    text: rich(
      'PredictX builds continuously updated models of every critical asset, combining reliability-engineering fundamentals — condition monitoring, failure modes and remaining useful life — with AI/ML, statistical and physics-informed methods applied where each fits the asset and its data. The platform closes the loop from raw machine signal to an engineer-approved maintenance action.',
    ),
  },
  {
    blockType: 'featureGrid',
    columns: '2',
    items: [
      {
        title: 'A validated, contextualized asset foundation',
        body: 'Automated ingestion and validation from PLC/SCADA, historian, MES, CMMS/EAM and SAP PM builds a reconciled dataset on a configurable, ISA-95-aligned asset hierarchy (with ISO 14224 taxonomy where industry-appropriate), catching data-quality issues before they reach a model.',
      },
      {
        title: 'Operating-state–normalized condition monitoring at scale',
        body: 'Health scores, anomaly detection and RUL estimates recalibrate for every asset, normalizing signals against RPM, load, machine state, product/SKU, cycle and operating conditions, across equipment classes, operating modes, duty cycles and drive configurations.',
      },
      {
        title: 'Comprehensive machine-failure prediction',
        body: 'Models screen continuously for asset-appropriate failure modes — bearing wear, misalignment, lubrication degradation, cavitation and overheating — then rank every asset by failure probability and consequence, directing engineers to the highest-impact equipment first.',
      },
      {
        title: 'Prioritized, actionable maintenance',
        body: 'A dynamic maintenance risk score combines failure probability, asset criticality, consequence and urgency into a single, continuously recalculated queue, with engineer review and CMMS/SAP PM work-order workflows that turn predictions into scheduled jobs.',
      },
    ],
  },
  {
    blockType: 'prose',
    text: rich(
      'Rather than another dashboard reporting what already broke, PredictX helps reliability teams answer: What is abnormal? Why? When could it fail? What should we do — and who approves it?',
    ),
  },
  {
    blockType: 'featureGrid',
    eyebrow: 'Core capabilities',
    heading: 'Predictive Maintenance & Condition Monitoring Capabilities',
    columns: '3',
    items: [
      {
        title: 'Asset Health Index',
        body: 'A continuously updated 0–100 equipment health score at every level — Site → Area → Line/Cell → Equipment → Component → Measurement Point — surfacing deterioration well before a conventional alarm.',
      },
      {
        title: 'Multivariate Anomaly Detection',
        body: 'Condition monitoring that analyzes vibration, temperature, current, RPM and load together, normalized to operating state, catching degradation signatures no single-tag threshold would flag.',
      },
      {
        title: 'Failure Prediction & RUL',
        body: 'Estimate failure probability within defined windows and remaining useful life, with prediction confidence and detection lead time, so teams know whether an asset can run safely to the next maintenance window.',
      },
      {
        title: 'Asset-Specific Failure Modes',
        body: 'Configurable FMEA/FMECA libraries per asset class — bearing and misalignment faults for motors, cavitation and seal wear for pumps, tooth and backlash for gearboxes, spindle degradation for CNC machines.',
      },
      {
        title: 'Dynamic Maintenance Risk Score',
        body: 'Combine failure probability, asset criticality, consequence (safety, quality, production, environment, cost) and urgency into one live, schedule-aware maintenance priority — beyond a static RPN.',
      },
      {
        title: 'Prediction Drivers & Work Orders',
        body: 'Show the contributing signals behind each prediction, then convert it into an engineer-reviewable action and a work order in CMMS/EAM or SAP PM.',
      },
    ],
  },
  {
    blockType: 'prose',
    eyebrow: 'Product intelligence in action',
    heading: 'Equipment Health & Failure Prediction',
    text: rich(
      'For a single at-risk asset, reliability engineers review the vibration diagnostics, prediction confidence, contributing signals and business consequence in one view, then approve the recommended action, which becomes a work order in SAP PM.',
      'Individual readings stay within conventional limits, but RMS velocity trends toward ISO 20816 alert zones and BPFO envelope harmonics rise, placing the asset early in the P-F interval, roughly nine days ahead of a conventional alarm, while there is still time to plan the intervention.',
    ),
  },
  {
    blockType: 'prose',
    heading: 'Maintenance Planning & Work Orders',
    text: rich(
      'The maintenance planner brings prioritized predictions together with production impact, maintenance windows, spare-parts availability and live SAP PM work-order status, so teams schedule the highest-impact assets first.',
      'This helps reliability and maintenance teams move from monitoring condition to planning maintenance around production schedules, shutdown windows, procurement lead times and the work already open in the CMMS.',
    ),
  },
  {
    blockType: 'flow',
    eyebrow: 'Data-to-decision architecture',
    heading: 'Predictive Maintenance Data Architecture — From OT to CMMS',
    intro:
      'PredictX spans the full path from the machine on the plant floor to an engineer-approved work order in SAP PM, and closes the loop as every maintenance outcome feeds back to improve the predictive models.',
    stages: [
      { label: 'Machines' },
      { label: 'PLC / CNC / VFD' },
      { label: 'SCADA / OPC UA / MQTT / Edge' },
      { label: 'Historian / MES' },
      { label: 'Data platform' },
      { label: 'AI + physics models' },
      { label: 'Dashboards' },
      { label: 'Engineer review' },
      { label: 'SAP PM' },
    ],
  },
  {
    blockType: 'featureGrid',
    eyebrow: 'Model performance & ROI',
    heading: 'Measurable Models and Financial Impact',
    columns: '2',
    items: [
      {
        title: 'Predictive-Model Performance',
        body: 'Every prediction is validated against work-order findings: precision, recall, false-positive rate, detection lead time, RUL error and prediction confidence are tracked over time, so reliability teams can trust the maintenance queue.',
      },
      {
        title: 'Financial Impact & ROI',
        body: 'Reliability is expressed in financial terms — cost per hour of downtime by line, avoided-downtime value, production at risk, maintenance-cost avoidance and spare-inventory impact — supporting a clear predictive-maintenance ROI case.',
      },
    ],
  },
  {
    blockType: 'featureGrid',
    eyebrow: 'Business impact',
    heading: 'Measurable Reliability & Maintenance Outcomes',
    columns: '2',
    items: [
      {
        title: 'Reduce Unplanned Downtime',
        body: 'Detect developing equipment failures before functional breakdown, widening the window to plan and converting downtime losses into avoided cost.',
      },
      {
        title: 'Improve Availability, OEE & MTBF',
        body: 'Schedule interventions around shutdown windows instead of emergency stoppages, improving availability, OEE and mean time between failures.',
      },
      {
        title: 'Increase Maintenance Productivity',
        body: 'Focus reliability teams on the highest-consequence assets first, using a live, engineer-approved maintenance risk score.',
      },
      {
        title: 'Lower Maintenance & Spares Cost',
        body: 'Reduce unnecessary interval-based maintenance and align spare-parts stocking to predicted, rather than assumed, demand.',
      },
    ],
  },
  {
    blockType: 'steps',
    eyebrow: 'Implementation',
    heading: 'Predictive Maintenance Implementation Approach',
    intro:
      'PredictX is implemented the way a reliability program is run — starting from asset criticality and data readiness, proving value on a focused pilot, then scaling condition-based and predictive maintenance across the plant.',
    items: [
      { label: 'Asset Criticality' },
      { label: 'Data Readiness' },
      { label: 'Failure-Mode Selection' },
      { label: 'Baseline' },
      { label: 'Pilot' },
      { label: 'Scale' },
    ],
    note: 'Best-fit assets for predictive maintenance include CNC machines, motors, pumps, compressors, gearboxes, conveyors and robotic cells — rotating and duty-cycle-driven equipment where condition data and failure consequence justify continuous monitoring.',
  },
];

/*
 * Top-level, not an exported `script` function.
 *
 * `payload run <file>` resolves the path and imports it — that is all. It does
 * not look for an export and call it. An `export const script = ...` therefore
 * loads the config, prints its startup notice and exits having done nothing,
 * which is exactly what happened the first time.
 */
const seed = async () => {
  const payload = await getPayload({ config: configPromise });

  const existing = await payload.find({
    collection: 'portfolio',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const data = {
    title: 'PredictX: Predictive Maintenance for Manufacturing',
    slug: SLUG,
    kind: 'product' as const,
    sector: 'manufacturing' as const,
    summary:
      'AI-powered predictive maintenance software for manufacturing: monitor equipment health, predict machine failures, estimate remaining useful life and prioritize condition-based maintenance.',
    featured: true,
    publishedAt: new Date().toISOString(),
    body,
    _status: 'published' as const,
  };

  if (existing.docs.length) {
    const id = existing.docs[0].id;
    await payload.update({ collection: 'portfolio', id, data, overrideAccess: true });
    console.log(`Updated portfolio entry ${id} (${SLUG}).`);
  } else {
    const created = await payload.create({ collection: 'portfolio', data, overrideAccess: true });
    console.log(`Created portfolio entry ${created.id} (${SLUG}).`);
  }

  console.log('\nView it at /portfolio/predictx, and edit it in the admin under Content → Portfolio.');
  console.log('The dashboard screenshots the document refers to are not included — upload them in');
  console.log('the admin and add image blocks wherever they belong.');

  process.exit(0);
};

await seed();
