/**
 * @file Slice of the state object that handles the common snackbar component at
 * the bottom of the app window.
 */

import { createSlice } from '@reduxjs/toolkit';

import { MessageSemantics } from './types';

const { actions, reducer } = createSlice({
  name: 'snackbar',

  initialState: {
    notification: {
      buttons: null,
      header: '',
      message: '',
      permanent: false,
      semantics: MessageSemantics.DEFAULT,
    },
  },

  reducers: {
    /**
     * Adds a fire-and-forget type of notification to the snackbar of the
     * application.
     */
    showNotification(state, action) {
      let newNotification;

      if (typeof action.payload === 'string') {
        newNotification = {
          buttons: null,
          header: '',
          message: String(action.payload),
          semantics: MessageSemantics.DEFAULT,
          permanent: false,
        };
      } else {
        const {
          buttons,
          header,
          message,
          semantics,
          permanent,
        } = action.payload;

        newNotification = {
          buttons: Array.isArray(buttons) ? buttons : null,
          header: header ? String(header) : '',
          message: String(message),
          semantics: String(semantics),
          permanent: Boolean(permanent),
        };
      }

      state.notification = newNotification;
    },
  },
});

export const { showNotification } = actions;

export default reducer;
