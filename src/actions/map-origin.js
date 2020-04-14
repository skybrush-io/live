/**
 * @file Action factories related to the origin of the map in the main
 * app window.
 */

import { createAction } from 'redux-actions';
import { CLEAR_ORIGIN, SET_AXIS_TYPE, SET_ORIGIN } from './types';

/**
 * Action factory that creates an action that clears the origin (home position)
 * of the map.
 */
export const clearOrigin = createAction(CLEAR_ORIGIN);

/**
 * Action factory that creates an action that sets the origin (home position)
 * and the orientation of the flat Earth coordinate system of the map.
 *
 * Both parameters are optional; when omitted, the corresponding parameter
 * will not be updated.
 */
export const setFlatEarthCoordinateSystemOrigin = createAction(
  SET_ORIGIN,
  (position, angle) => ({
    position,
    angle,
  })
);

/**
 * Action factory that creates an action that sets the orientation of the flat
 * Earth coordinate system of the map.
 */
export const setFlatEarthCoordinateSystemOrientation = createAction(
  SET_ORIGIN,
  (angle) => ({ angle })
);

/**
 * Action factory that creates an action that sets the type of the
 * flat Earth coordinate system (NEU or NWU) of the map.
 */
export const setFlatEarthCoordinateSystemType = createAction(
  SET_AXIS_TYPE,
  (type) => ({ type })
);
