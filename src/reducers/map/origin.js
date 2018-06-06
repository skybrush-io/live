/**
 * @file Reducer function for handling the position of the origin on the map.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

/**
 * The state of the origin (home position) of the map.
 */
const defaultState = {
  position: undefined
}

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions({
  CLEAR_HOME_POSITION: (state, action) => u({
    position: u.constant(undefined)
  }, state),

  SET_HOME_POSITION: (state, action) => u({
    position: u.constant(action.payload.position)
  }, state)
}, defaultState)

export default reducer
