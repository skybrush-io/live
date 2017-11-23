/**
 * @file Reducer for the common snackbar component at the bottom of the
 * app window.
 */

import { handleActions } from 'redux-actions'

/**
 * The default state of the snackbar.
 */
const defaultState = {
  messageId: 0,
  message: '',
  open: false
}

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions({
  DISMISS_SNACKBAR (state, action) {
    return {
      ...state,
      message: '',
      open: false
    }
  },

  SHOW_SNACKBAR_MESSAGE (state, action) {
    return {
      ...state,
      messageId: state.messageId + 1,
      message: action.payload,
      open: true
    }
  }
}, defaultState)

export default reducer
