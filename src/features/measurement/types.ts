import { type Identifier } from '~/utils/collections';
import type { LatLonObject } from '~/utils/geography';

/**
 * @example
 * {
 *   "id": "47",
 *   "startedAt": 12323532726      // Unix timestamp, milliseconds
 *   "lastSampleAt": 12323542726   // Unix timestamp, milliseconds
 *   "extraSamplingTime": 0,       // milliseconds
 *   "numSamples": 100,
 *   "mean": {
 *     "lat": 47,
 *     "lon": 19,
 *     "amsl": 123,
 *     "ahl": 1.2
 *   },
 *   "sqDiff": {...}
 * }
 */
export type AveragingResult = {
  id: Identifier;
  startedAt?: number;
  lastSampleAt?: number;
  extraSamplingTime: number;
  numSamples: number;
  sampling: boolean;
  mean: LatLonObject & {
    amsl: number;
    ahl: number;
  };
  sqDiff: LatLonObject & {
    amsl: number;
    ahl: number;
  };
};
