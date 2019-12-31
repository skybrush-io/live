/**
 * @file Slice of the state object that handles the common snackbar component at
 * the bottom of the app window.
 */

import { createSlice } from '@reduxjs/toolkit';

import { MessageSemantics } from './types';

const { actions, reducer } = createSlice({
  name: 'snackbar',

  initialState: {
    messageId: 0,
    message: '',
    open: false,
    semantics: MessageSemantics.DEFAULT
  },

  reducers: {
    dismissSnackbar(state) {
      state.open = false;
    },

    showSnackbarMessage(state, action) {
      let semantics;
      let message;

      if (typeof action.payload === 'string') {
        message = String(action.payload);
        semantics = MessageSemantics.DEFAULT;
      } else {
        message = String(action.payload.message);
        semantics = action.payload.semantics;
      }

      state.messageId += 1;
      state.message = message;
      state.open = true;
      state.semantics = semantics;
    }
  }
});

export const { dismissSnackbar, showSnackbarMessage } = actions;

export default reducer;
