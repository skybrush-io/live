/**
 * @file Selectors related to the map view.
 */

import { createSelector } from '@reduxjs/toolkit';

/**
 * Selector that returns the rotation angle of the map view, cast into a
 * float.
 *
 * This is needed because we store the rotation angle of the map view as a
 * string by default to avoid rounding errors, but most components require
 * a float instead.
 */
export const getMapViewRotationAngle = createSelector(
  state => state.map.view.angle,
  angle => parseFloat(angle)
);

/**
 * Selector that returns the rotation angle of the flat Earth coordinate
 * system used on the map, cast into a float.
 *
 * This is needed because we store the rotation angle of the coordinate system
 * as a string by default to avoid rounding errors, but most components require
 * a float instead.
 */
export const getMapOriginRotationAngle = createSelector(
  state => state.map.origin.angle,
  angle => parseFloat(angle)
);
