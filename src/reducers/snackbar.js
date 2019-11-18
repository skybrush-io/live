/**
 * @file Reducer for the common snackbar component at the bottom of the
 * app window.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

import { MessageSemantics } from '~/model/snackbar';

/**
 * The default state of the snackbar.
 */
const defaultState = {
  messageId: 0,
  message: '',
  open: false,
  semantics: MessageSemantics.DEFAULT
};

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions(
  {
    DISMISS_SNACKBAR: state =>
      /* don't reset message or semantics here; it would cause a visual glitch
       * when the snackbar is closing */
      u({ open: false }, state),

    SHOW_SNACKBAR_MESSAGE: (state, action) => {
      let semantics;
      let message;

      if (typeof action.payload === 'string') {
        message = String(action.payload);
        semantics = MessageSemantics.DEFAULT;
      } else {
        message = String(action.payload.message);
        semantics = action.payload.semantics;
      }

      return u(
        {
          messageId: state.messageId + 1,
          open: true,
          message,
          semantics
        },
        state
      );
    }
  },
  defaultState
);

export default reducer;
