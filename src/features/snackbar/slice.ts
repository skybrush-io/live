/**
 * @file Slice of the state object that handles the common snackbar component at
 * the configured side (bottom by default) of the app window.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { MessageSemantics, type Notification } from './types';

type SnackbarSliceState = ReadonlyDeep<{
  notification: Notification;
}>;

const initialState: SnackbarSliceState = {
  notification: {
    buttons: undefined,
    header: '',
    message: '',
    permanent: false,
    semantics: MessageSemantics.DEFAULT,
  },
};

const { actions, reducer } = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    /**
     * Adds a fire-and-forget type of notification to the snackbar of the
     * application.
     */
    showNotification(state, action: PayloadAction<string | Notification>) {
      let newNotification;

      if (typeof action.payload === 'string') {
        newNotification = {
          buttons: undefined,
          header: '',
          message: String(action.payload),
          semantics: MessageSemantics.DEFAULT,
          permanent: false,
        };
      } else {
        const { buttons, header, message, semantics, permanent } =
          action.payload;

        newNotification = {
          buttons: Array.isArray(buttons) ? buttons : undefined,
          header: header ? String(header) : '',
          message: String(message),
          semantics,
          permanent: Boolean(permanent),
        };
      }

      state.notification = newNotification;
    },
  },
});

export const { showNotification } = actions;

export default reducer;
