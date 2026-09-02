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
 * The content is transcribed from PredictX_Case_Study_Final.docx, wording
 * unchanged.
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
    heading: 'The Predictive Maintenance Challenges Usually Faced in Manufacturing',
    text: rich(
      'Manufacturing plants running hundreds or thousands of interconnected assets face a widening gap between the volume of machine and process data now available and the reliability engineering capacity needed to act on it. Four distinct dynamics make unplanned downtime difficult to prevent using conventional tools.',
    ),
  },
  {
    blockType: 'featureGrid',
    columns: '2',
    items: [
      {
        title: 'IT OT Convergence in Manufacturing Data',
        body: 'PLC and SCADA, IoT condition monitoring sensors, historian databases, MES platforms, CMMS and EAM systems, SAP PM, and the wider ERP sit in disconnected OT and IT systems with inconsistent tags, gaps, and manual overrides, so engineers must reconcile numbers before analysis can begin. Confidence in the result erodes every time.',
      },
      {
        title: 'Equipment failures are detected too late',
        body: 'An alarm system that is fixed threshold activates only after a variable has exceeded the predetermined limits, which are usually close to the end of the P-F cycle, where only emergency maintenance will suffice. Degradation indications from early vibrations, temperature, motor current, and lubrication will be below the alarm limits until a number of days or even weeks pass.',
      },
      {
        title: 'Interval-based maintenance drifts from reality',
        body: 'Predictive maintenance using a calendar, number of operating hours, cycles, or a predetermined time interval set by the OEM does not account for the work performed by each piece of equipment since the same maintenance schedule is used for all assets irrespective of their actual load factor. Due to the fact that even identical machines experience wear at a different pace, the result is over-maintenance and breakdowns between fixed intervals.',
      },
      {
        title: 'Maintenance priority is not business priority',
        body: 'One plant may be able to raise hundreds of alarms and alerts in a week, but traditional FMEA and RPN values do not usually take into account the actual production schedule at the time or the actual consequences of that particular failure. The reliability team must consider the safety, quality, production, environment, and maintenance implications of the failure to determine its significance.',
      },
    ],
  },
  {
    blockType: 'prose',
    eyebrow: 'The solution',
    heading: 'An AI-Powered Predictive Maintenance Platform',
    text: rich(
      'Every asset has a constantly refreshed PredictX model that uses reliability engineering principles such as condition monitoring, failure modes, and remaining useful life calculations together with the application of AI, machine learning, statistics, and physics-based modeling as appropriate to each asset. Raw machine signal becomes an engineer-approved action. That is the whole loop.',
    ),
  },
  {
    blockType: 'featureGrid',
    columns: '2',
    items: [
      {
        title: 'A validated, contextualized asset foundation',
        body: 'Automated ingestion and validation from PLC and SCADA, historian, MES, CMMS and EAM, and SAP PM builds a reconciled dataset on a configurable, ISA-95-aligned asset hierarchy, with ISO 14224 taxonomy where industry-appropriate. This foundation catches data quality issues before they ever reach a model.',
      },
      {
        title: 'Asset Health Monitoring for Manufacturing Plants',
        body: 'Health scores, anomaly detection, and RUL estimates, expressed as a real-time asset health score across the plant, recalibrate for every asset, normalizing signals against RPM, load, machine state, product or SKU, cycle, and operating conditions, across equipment classes, operating modes, duty cycles, and drive configurations.',
      },
      {
        title: 'Comprehensive machine failure prediction',
        body: 'These models perform a constant assessment for asset-relevant failure modes such as bearing wear, misalignment, deterioration of lubricants, cavitation, and overheating, followed by ranking all assets based on the likelihood and consequences of failure.',
      },
      {
        title: 'Maintenance focused on action',
        body: 'A dynamic risk score for maintenance will be determined by failure probability, criticality, consequences, and urgency, and this information will all be combined into a continuously updated queue with engineer approval and CMMS/SAP PM work order process workflows.',
      },
    ],
  },
  {
    blockType: 'prose',
    text: rich(
      'Unlike other dashboards that report failures, PredictX can help reliability engineers determine what is abnormal, why it is abnormal, when it will fail, and what action needs to be taken.',
    ),
  },
  {
    blockType: 'featureGrid',
    eyebrow: 'Core capabilities',
    heading: 'Predictive Maintenance and Condition Monitoring Capabilities',
    columns: '3',
    items: [
      {
        title: 'Asset Health Index',
        body: 'Equipment health status ranging from 0 to 100 continuously reported at each level, starting from the site level down to the area level, line/cell level, equipment level, component level, and measurement level, highlighting early deterioration.',
      },
      {
        title: 'Multivariate Anomaly Detection',
        body: 'Machine condition monitoring involving the analysis of vibration, temperature, current, revolutions per minute, and loading all normalized against operating state, allowing detection of signs of deterioration not identifiable by a simple threshold on a single tag.',
      },
      {
        title: 'Failure Prediction and Remaining Useful Life',
        body: 'Remaining useful life estimation for industrial equipment reported alongside failure probability within defined windows, with prediction confidence and detection lead time, so teams know whether an asset can run safely to the next maintenance window.',
      },
      {
        title: 'Asset-Specific Failure Modes',
        body: 'Configurable FMEA and FMECA libraries per asset class: bearing and misalignment faults for motors, cavitation and seal wear for pumps, tooth and backlash for gearboxes, spindle degradation for CNC machines.',
      },
      {
        title: 'Dynamic Maintenance Risk Score',
        body: 'Combines failure probability, asset criticality, consequence across safety, quality, production, environment, and cost, and urgency into one live, schedule-aware maintenance priority, going beyond a static RPN.',
      },
      {
        title: 'Prediction Drivers and Work Orders',
        body: 'Shows the contributing signals behind each prediction, then converts it into an engineer-reviewable action and a work order in CMMS, EAM, or SAP PM. In practice, this is what it means to connect predictive maintenance software to SAP PM.',
      },
    ],
  },
  {
    blockType: 'prose',
    eyebrow: 'Product intelligence in action',
    heading: 'Equipment Health and Failure Prediction',
    text: rich(
      'For a single at-risk asset, reliability engineers review vibration analysis for predictive maintenance in manufacturing, alongside prediction confidence, contributing signals, and business consequence, in one view, then approve the recommended action. This is how predictive maintenance work orders inside SAP PM actually get created.',
      'Individual readings stay within conventional limits, but RMS velocity trends toward ISO 20816 alert zones and BPFO envelope harmonics rise, placing the asset early in the P-F interval, roughly nine days ahead of a conventional alarm, while there is still time to plan the intervention.',
    ),
  },
  {
    blockType: 'prose',
    heading: 'Maintenance Planning and Work Orders',
    text: rich(
      'The maintenance planner brings prioritized predictions together with production impact, maintenance windows, spare parts availability, and live SAP PM work order status, so teams schedule the highest impact assets first.',
      'This will help the reliability and maintenance team to transition from condition-based maintenance to maintenance planned based on production schedules, downtimes, procurement lead time, and existing work orders in the CMMS.',
    ),
  },
  {
    blockType: 'prose',
    eyebrow: 'Data-to-decision architecture',
    heading: 'An Industrial Data Platform for Predictive Maintenance',
    text: rich(
      'PredictX covers every stage in between, from the device on the plant floor to a work order approved by an engineer in SAP PM, thereby closing the loop as every maintenance outcome contributes to refining the predictive models.',
    ),
  },
  {
    blockType: 'flow',
    stages: [
      { label: 'Machines' },
      { label: 'PLC / CNC / VFD' },
      { label: 'SCADA / OPC UA / MQTT / Edge' },
      { label: 'Historian / MES' },
      { label: 'data platform' },
      { label: 'AI and physics models' },
      { label: 'dashboards' },
      { label: 'engineer review' },
      { label: 'SAP PM' },
    ],
  },
  {
    blockType: 'featureGrid',
    eyebrow: 'Model performance and ROI',
    heading: 'Measurable Models and Financial Impact',
    columns: '2',
    items: [
      {
        title: 'Predictive Model Performance',
        body: 'Every prediction is validated against work order findings: precision, recall, false positive rate, detection lead time, remaining useful life error, and prediction confidence are tracked over time, so reliability teams can trust the maintenance queue.',
      },
      {
        title: 'Predictive Maintenance ROI and Payback for Manufacturers',
        body: 'Reliability is expressed in financial terms, including cost per hour of downtime by line, avoided downtime value, production at risk, maintenance cost avoidance, and spare inventory impact, supporting a clear payback case.',
      },
    ],
  },
  {
    blockType: 'featureGrid',
    eyebrow: 'Business impact',
    heading: 'Measurable Reliability and Maintenance Outcomes',
    columns: '2',
    items: [
      {
        title: 'Reducing Unplanned Downtime on the Plant Floor',
        body: 'Detect any possible problem with your equipment before any breakdown happens, increase your planning period, and turn the downtime cost into saving.',
      },
      {
        title: 'Improve Availability, OEE, and MTBF',
        body: 'Schedule the interventions according to the shutdown windows rather than using emergency stoppages to enhance availability, OEE, and MTBF.',
      },
      {
        title: 'Increase Maintenance Productivity',
        body: 'Focus on reliability teams on the highest consequence assets first, using a live, engineer-approved maintenance risk score.',
      },
      {
        title: 'Lower Maintenance and Spares Cost',
        body: 'Reduce unnecessary interval-based maintenance and align spare parts stocking to predicted, rather than assumed, demand.',
      },
    ],
  },
  {
    blockType: 'steps',
    eyebrow: 'Implementation',
    heading: 'Predictive Maintenance Implementation Approach',
    intro:
      'PredictX is implemented the way a reliability program is run. The first step is asset criticality analysis for manufacturing plants paired with data readiness, followed by proving value on a focused pilot, and then scaling condition-based and predictive maintenance across the plant.',
    items: [
      { label: 'Criticality of the Asset' },
      { label: 'Data Readiness' },
      { label: 'Selection of Failure Mode' },
      { label: 'Baseline' },
      { label: 'Pilot' },
      { label: 'Scaling' },
    ],
    note: 'Best suited assets for predictive maintenance are CNC machinery, motors, pumps, compressors, gear boxes, conveyor belts, and robotics: rotating and duty cycle driven machines where it makes sense to monitor their condition due to high costs of failure.',
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
      'A predictive maintenance case study for manufacturing: PredictX work orders inside SAP PM, asset health monitoring, and a measurable ROI case.',
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
