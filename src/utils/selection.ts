/**
 * Selection-related utility functions.
 */

import {
  areaIdToGlobalId,
  GROSS_CONVEX_HULL_AREA_ID,
  homePositionIdToGlobalId,
  isHomePositionId,
} from '~/model/identifiers';

import type { Identifier } from './collections';

// Utility function for applying all selection operations synchronously on the
// convex hull and all takeoff positions, effectively treating them as a group
export const groupConvexHullAndTakeoffPositions = (
  ids: Identifier[],
  takeoffIds: Identifier[]
): Identifier[] =>
  ids.includes(areaIdToGlobalId(GROSS_CONVEX_HULL_AREA_ID)) ||
  ids.some(isHomePositionId)
    ? [
        ...new Set([
          ...ids,
          ...takeoffIds.map(homePositionIdToGlobalId),
          areaIdToGlobalId(GROSS_CONVEX_HULL_AREA_ID),
        ]),
      ]
    : ids;
