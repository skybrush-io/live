/**
 * @file Selectors related to the map view.
 */

import { createSelector } from '@reduxjs/toolkit';

import { FlatEarthCoordinateSystem } from '~/utils/geography';

/**
 * Selector that returns a conversion object that can be used to transform
 * longitude-latitude pairs to/from flat Earth coordinates according to the
 * current parameters set in the state object.
 */
export const getFlatEarthCoordinateTransformer = createSelector(
  (state) => state.map.origin,
  (origin) =>
    origin.position
      ? new FlatEarthCoordinateSystem({
          origin: origin.position,
          orientation: origin.angle,
          type: origin.type,
        })
      : undefined
);

/**
 * Selector that returns the center position of the map view in lon-lat format.
 */
export const getMapViewCenterPosition = (state) => state.map.view.position;

/**
 * Selector that returns the rotation angle of the map view, cast into a
 * float.
 *
 * This is needed because we store the rotation angle of the map view as a
 * string by default to avoid rounding errors, but most components require
 * a float instead.
 */
export const getMapViewRotationAngle = createSelector(
  (state) => state.map.view.angle,
  Number.parseFloat
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
  (state) => state.map.origin.angle,
  Number.parseFloat
);

/**
 * Selector that returns whether the current coordinate system is left-handed
 * or right-handed.
 */
export const isMapCoordinateSystemLeftHanded = (state) =>
  state.map.origin.type === 'neu';

/**
 * Selector that returns whether the map coordinate system is specified.
 */
export const isMapCoordinateSystemSpecified = (state) =>
  Array.isArray(state.map.origin.position);
