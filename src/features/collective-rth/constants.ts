import type { CollectiveRTHParameters } from '~/flockwave/types';

/**
 * Default parameters of a collective RTH plan calculation.
 */
export const COLLECTIVE_RTH_DEFAULTS: CollectiveRTHParameters = {
  minDistance: 2,
  timeResolution: 10,
  horizontalVelocity: 5,
  verticalVelocity: 1.5,
};
