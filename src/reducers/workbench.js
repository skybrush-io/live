/**
 * @file Reducer for saving and storing the state of the main
 * workbench component.
 */

import { handleActions } from 'redux-actions'

/**
 * The default state of the workbench.
 */
const defaultState = {
  state: undefined
}

/**
 * The reducer function that handles actions related to the workbench.
 */
const reducer = handleActions({
  SAVE_WORKBENCH_STATE: (state, action) => (
    Object.assign({}, state, {
      state: action.payload
    })
  )
}, defaultState)

export default reducer
