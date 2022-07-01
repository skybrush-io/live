/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the dialog that allows the user to edit the
 * app settings.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

/**
 * The reducer that handles actions related to the app settings dialog.
 */
const { reducer, actions } = createSlice({
  name: 'app-settings',

  /**
   * The default state for the app settings dialog.
   */
  initialState: {
    open: false,
    selectedTab: 'display',
  },

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
    setAppSettingsDialogTab(state, action) {
      state.selectedTab = action.payload;
    },

    /**
     * Action that shows the app settings dialog.
     */
    showAppSettingsDialog: noPayload((state) => {
      state.open = true;
    }),

    /**
     * Action that toggles the visibility of the app settings dialog.
     */
    toggleAppSettingsDialog: noPayload((state) => {
      state.open = !state.open;
    }),
  },
});

export { reducer as default, actions };
