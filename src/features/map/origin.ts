/**
 * @file Reducer function for handling the position of the origin on the map.
 */

import config from 'config';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import defaults from 'lodash-es/defaults';

import { type Origin, OriginType } from './types';

/**
 * The state of the origin (home position) and the global flat Earth coordinate
 * system of the map.
 *
 * The flat Earth coordinate system is at the given position and its zero
 * degree heading points towards the heading given in the `angle` property.
 */
type MapOriginSliceState = Origin;

const initialState: MapOriginSliceState = defaults(config.map.origin, {
  position: config.map.view.position,
  angle: config.map.view.angle,
  type: OriginType.NWU,
});

/**
 * The reducer function that handles actions related to the tool selection.
 */
const { reducer, actions } = createSlice({
  name: 'map/origin',
  initialState,
  reducers: {
    updateFlatEarthCoordinateSystem(
      state,
      action: PayloadAction<Partial<Origin>>
    ) {
      const { angle, position, type } = action.payload;

      if (position !== undefined) {
        state.position = position;
      }

      if (angle !== undefined) {
        state.angle = angle;
      }

      if (type !== undefined) {
        state.type = type;
      }
    },
  },
});

export const { updateFlatEarthCoordinateSystem } = actions;

export function setFlatEarthCoordinateSystemOrigin(
  position: Origin['position']
): PayloadAction<{ position?: Origin['position'] }> {
  return updateFlatEarthCoordinateSystem({ position });
}

export function setFlatEarthCoordinateSystemOrientation(
  angle: Origin['angle']
): PayloadAction<{ angle?: Origin['angle'] }> {
  return updateFlatEarthCoordinateSystem({ angle });
}

export function setFlatEarthCoordinateSystemType(
  type: Origin['type']
): PayloadAction<{ type?: Origin['type'] }> {
  return updateFlatEarthCoordinateSystem({ type });
}

export default reducer;
