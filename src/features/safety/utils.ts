import { ok, type Result } from 'neverthrow';

import { bufferPolygon } from '~/utils/geography';
import { type Coordinate2D, simplifyPolygon } from '~/utils/math';

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
  (coordinates: Coordinate2D[]): Result<Coordinate2D[], string> =>
    bufferPolygon(coordinates, horizontalMargin).andThen(
      (bufferedCoordinates) =>
        simplify
          ? simplifyPolygon(bufferedCoordinates, maxVertexCount)
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
