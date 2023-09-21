/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the dialog that allows the user to edit the
 * app settings.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

import { AppSettingsDialogTab } from './types';

type AppSettingsDialogSliceState = ReadonlyDeep<{
  open: boolean;
  selectedTab: AppSettingsDialogTab;
}>;

/**
 * The default state for the app settings dialog.
 */
const initialState: AppSettingsDialogSliceState = {
  open: false,
  selectedTab: AppSettingsDialogTab.DISPLAY,
};

/**
 * The reducer that handles actions related to the app settings dialog.
 */
const { reducer, actions } = createSlice({
  name: 'app-settings',
  initialState,
  reducers: {
    /**
     * Action that will close the app settings dialog.
     */
    closeAppSettingsDialog(state) {
      state.open = false;
    },

    /**
     * Action that will set the selected tab in the app settings dialog.
     */
    setAppSettingsDialogTab(
      state,
      action: PayloadAction<AppSettingsDialogTab>
    ) {
      state.selectedTab = action.payload;
    },

    /**
     * Action that shows the app settings dialog.
     */
    showAppSettingsDialog: noPayload<AppSettingsDialogSliceState>((state) => {
      state.open = true;
    }),

    /**
     * Action that toggles the visibility of the app settings dialog.
     */
    toggleAppSettingsDialog: noPayload<AppSettingsDialogSliceState>((state) => {
      state.open = !state.open;
    }),
  },
});

export { reducer as default, actions };
