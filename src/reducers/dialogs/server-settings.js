/**
 * @file Redux slice for handling the part of the state object that
 * stores the server to connect to.
 */

import { createSlice } from '@reduxjs/toolkit';
import { noPayload } from '~/utils/redux';

/**
 * The reducer that handles actions related to the server settings.
 */
const { reducer, actions } = createSlice({
  name: 'server-settings',

  /**
   * The default settings for the part of the state object being defined here.
   *
   * Note that we don't forward the default hostname and port from the
   * configuration object to here because it means that we would be connecting
   * to the default server for a split second when the state is being loaded
   * back from the Redux local storage. Instead of that, we will wait until
   * the Redux store has loaded its state back from the local storage and then
   * check whether we need to fill in the default hostname and port.
   */
  initialState: {
    active: false,
    hostName: null,
    port: 5000,
    isSecure: false,
    dialogVisible: false,
    selectedTab: 'auto',
  },

  reducers: {
    /**
     * Action that will close the server settings dialog and optionally update
     * the current server settings from the payload.
     */
    closeServerSettingsDialog(state, action) {
      Object.assign(state, action.payload, { dialogVisible: false });
    },

    /**
     * Action that will disconnect from the current server that we are
     * connected to.
     */
    disconnectFromServer(state) {
      state.active = false;
    },

    /**
     * Action that will set the selected tab in the server settings dialog.
     */
    setServerSettingsDialogTab(state, action) {
      state.selectedTab = action.payload;
    },

    /**
     * Action that shows the server settings dialog.
     */
    showServerSettingsDialog: noPayload((state) => {
      state.dialogVisible = true;
    }),

    /**
     * Action that will update the current server settings from the payload
     * without affecting whether the server settings dialog is visible or not.
     */
    updateServerSettings(state, action) {
      Object.assign(state, action.payload);
    },
  },
});

export { reducer as default, actions };
