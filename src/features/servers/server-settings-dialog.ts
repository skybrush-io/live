/**
 * @file Redux slice for handling the part of the state object that
 * stores the server to connect to.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

import { Protocol, ServerSettingsDialogTab } from './types';

export const isTCPConnectionSupported = Boolean(window.bridge?.createTCPSocket);

type ServerSettingsDialogSliceState = ReadonlyDeep<{
  active: boolean;
  protocol: Protocol;
  hostName?: string;
  port: number;
  isSecure: boolean;
  dialogVisible: boolean;
  selectedTab: ServerSettingsDialogTab;
}>;

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
const initialState: ServerSettingsDialogSliceState = {
  active: false,
  // These defaults might actually be pointless, since as long as `hostName`
  // is `null`, the onboarding saga will just overwrite them anyway.
  protocol: isTCPConnectionSupported ? Protocol.TCP : Protocol.WS,
  hostName: undefined,
  port: isTCPConnectionSupported ? 5001 : 5000,
  isSecure: false,
  dialogVisible: false,
  selectedTab: ServerSettingsDialogTab.AUTO,
};

/**
 * The reducer that handles actions related to the server settings.
 */
const { reducer, actions } = createSlice({
  name: 'server-settings-dialog',
  initialState,
  reducers: {
    /**
     * Action that will close the server settings dialog and optionally update
     * the current server settings from the payload.
     */
    closeServerSettingsDialog(
      state,
      action: PayloadAction<Partial<ServerSettingsDialogSliceState>>
    ) {
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
    setServerSettingsDialogTab(
      state,
      action: PayloadAction<ServerSettingsDialogTab>
    ) {
      state.selectedTab = action.payload;
    },

    /**
     * Action that shows the server settings dialog.
     */
    showServerSettingsDialog: noPayload<ServerSettingsDialogSliceState>(
      (state) => {
        state.dialogVisible = true;
      }
    ),

    /**
     * Action that will update the current server settings from the payload
     * without affecting whether the server settings dialog is visible or not.
     */
    updateServerSettings(
      state,
      action: PayloadAction<Partial<ServerSettingsDialogSliceState>>
    ) {
      Object.assign(state, action.payload);
    },
  },
});

export { reducer as default, actions };
