/**
 * @file Reducer function for handling the position of the origin on the map.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

/**
 * The state of the origin (home position) and the global flat Earth coordinate
 * system of the map.
 *
 * The flat Earth coordinate system is at the given position and its zero
 * degree heading points towards the heading given in the `angle` property.
 */
const defaultState = {
  position: null,
  angle: '0',
  type: 'nwu'
};

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions(
  {
    CLEAR_ORIGIN: (state) => u({ position: u.constant(null) }, state),

    SET_ORIGIN: (state, action) => {
      const { angle, position, type } = action.payload;
      const updates = {};
      if ('position' in action.payload) {
        updates.position = u.constant(position);
      }

      if (angle !== undefined) {
        updates.angle = angle;
      }

      if (type !== undefined) {
        updates.type = type;
      }

      return u(updates, state);
    },

    SET_AXIS_TYPE: (state, action) => {
      const { type } = action.payload;
      const updates = { type };
      return u(updates, state);
    }
  },
  defaultState
);

export default reducer;
