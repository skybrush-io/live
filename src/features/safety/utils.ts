import { ok, type Result } from 'neverthrow';

import { bufferPolygon, type EasNor } from '~/utils/geography';
import { simplifyPolygon } from '~/utils/simplification';

export const makeGeofenceGenerationSettingsApplicator =
  ({
    horizontalMargin,
    maxVertexCount,
    simplify,
  }: {
    horizontalMargin: number;
    maxVertexCount: number;
    simplify: boolean;
  }) =>
  (coordinates: EasNor[]): Result<EasNor[], string> =>
    false
      ? ok(coordinates)
      : bufferPolygon(coordinates, horizontalMargin).andThen(
          (bufferedCoordinates) =>
            simplify
              ? (console.log('simplify', { bufferedCoordinates }) ??
                simplifyPolygon(bufferedCoordinates, maxVertexCount))
              : ok(bufferedCoordinates)
        );

/**
 * Common implementation of height and distance limits.
 */
const createLimitProposal =
  ({ rounding = 10, minimum }: { rounding?: number; minimum?: number } = {}) =>
  (maxValue = 0, margin = 0): number => {
    // Round up to nearest number divisible by the rounding factor
    // so we have a nice number that we can present on the UI.
    return Math.max(
      minimum ?? rounding,
      Math.ceil((maxValue + margin) / rounding) * rounding
    );
  };

/**
 * Proposes a height limit for a geofence, assuming the given maximum altitude
 * in the mission and the given safety margin.
 *
 * NOTE: Always propose a minimum distance limit of 30 meters
 *       to allow for manual test flights if needed.
 */
export const proposeDistanceLimit = createLimitProposal({ minimum: 30 });

/**
 * Proposes a height limit for a geofence, assuming the given maximum altitude
 * in the mission and the given safety margin.
 *
 * NOTE: Always propose a minimum height limit of 30 meters
 *       to allow for manual test flights if needed.
 */
export const proposeHeightLimit = createLimitProposal({ minimum: 30 });
