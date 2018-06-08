/**
 * @file Reducer function for handling the position of the origin on the map.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

/**
 * The state of the origin (home position) and the global flat Earth coordinate
 * system of the map.
 *
 * The flat Earth coordinate system is at the given position and its zero
 * degree heading points towards the heading given in the `angle` property.
 */
const defaultState = {
  position: undefined,
  angle: 0
}

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions({
  CLEAR_HOME_POSITION: (state, action) => u({
    position: u.constant(undefined)
  }, state),

  SET_HOME_POSITION: (state, action) => {
    const { position, angle } = action.payload
    const updates = {
      position: u.constant(position)
    }
    if (angle !== undefined) {
      updates.angle = u.constant(angle)
    }
    return u(updates, state)
  }
}, defaultState)

export default reducer
