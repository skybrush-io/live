/**
 * @file Reducer function for handling the position of the origin on the map.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * The state of the origin (home position) and the global flat Earth coordinate
 * system of the map.
 *
 * The flat Earth coordinate system is at the given position and its zero
 * degree heading points towards the heading given in the `angle` property.
 */
const initialState = {
  position: [18.915125, 47.486305], // Sensible default: Farkashegy Airfield
  angle: '59',
  type: 'nwu',
};

/**
 * The reducer function that handles actions related to the tool selection.
 */
const { reducer, actions } = createSlice({
  name: 'map/origin',
  initialState,
  reducers: {
    updateFlatEarthCoordinateSystem(state, action) {
      const { angle, position, type } = action.payload;
      if ('position' in action.payload) {
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

export function setFlatEarthCoordinateSystemOrigin(position) {
  return updateFlatEarthCoordinateSystem({ position });
}

export function setFlatEarthCoordinateSystemOrientation(angle) {
  return updateFlatEarthCoordinateSystem({ angle });
}

export function setFlatEarthCoordinateSystemType(type) {
  return updateFlatEarthCoordinateSystem({ type });
}

export default reducer;
