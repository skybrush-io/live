/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the layers dialog.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

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
      return u({
        dialogVisible: false,
        selectedLayer: undefined
      }, state)
    } else {
      return state
    }
  },

  SHOW_LAYERS_DIALOG: (state, action) => u({
    dialogVisible: true,
    selectedLayer: action.payload.layerId
  }, state),

  CLOSE_LAYERS_DIALOG: (state, action) => u({
    dialogVisible: false,
    selectedLayer: undefined
  }, state)
}, defaultState)

export default reducer
