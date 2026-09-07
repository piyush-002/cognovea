import type { Service } from './types';
import { fractionalDataLeadership } from './fractional-data-leadership';
import { manufacturingAnalytics } from './manufacturing';
import { oilAndGasAnalytics } from './oil-and-gas';
import { sapDataMigration } from './sap-data-migration';
import { scadaDataAnalytics } from './scada-data-analytics';

export type { Service, ServiceSection } from './types';

/**
 * Built in the order the keyword research put them: softest competition and
 * tightest fit with manufacturers and energy operators first, rather than the
 * biggest-sounding terms first.
 *
 * The remaining pages in the plan — data governance, predictive analytics,
 * business intelligence, RAG, MLOps, agentic AI, platforms, managed services —
 * are specified in the screen and keyword map and are deliberately not stubbed
 * here. An empty page ranks worse than no page.
 */
export const SERVICES: Service[] = [
  sapDataMigration,
  scadaDataAnalytics,
  oilAndGasAnalytics,
  manufacturingAnalytics,
  fractionalDataLeadership,
];

export const getService = (slug: string): Service | undefined => SERVICES.find((s) => s.slug === slug);

export {
  sapDataMigration,
  scadaDataAnalytics,
  oilAndGasAnalytics,
  manufacturingAnalytics,
  fractionalDataLeadership,
};
