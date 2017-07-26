/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the layers dialog.
 */

import { handleActions } from 'redux-actions'

/**
 * The default settings for the part of the state object being defined here.
 */
const defaultState = {
  dialogVisible: false,
  selectedLayer: undefined
}

/**
 * The reducer function that handles actions related to the layers dialog.
 */
const reducer = handleActions({
  REMOVE_LAYER (state, action) {
    if (state.selectedLayer === action.payload) {
      return Object.assign({}, state, { selectedLayer: undefined })
    } else {
      return state
    }
  },

  SHOW_LAYERS_DIALOG: (state, action) => (
    Object.assign({}, state, { dialogVisible: true })
  ),

  CLOSE_LAYERS_DIALOG: (state, action) => (
    Object.assign({}, state, { dialogVisible: false })
  ),

  SET_SELECTED_LAYER_IN_LAYERS_DIALOG: (state, action) => (
    Object.assign({}, state, { selectedLayer: action.payload })
  )
}, defaultState)

export default reducer
