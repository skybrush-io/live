/**
 * @file File for storing hotkey configuration.
 */

import copy from 'copy-to-clipboard';
import { showLayersDialog } from './actions/layers';
import {
  selectAllUAVFeatures,
  clearSelection,
  selectMapTool,
} from './actions/map';
import { showMessagesDialog } from './actions/messages';
import { showNotification } from './features/snackbar/slice';

import { getSelectedUAVIds } from './selectors/selection';
import {
  fitAllFeaturesSignal,
  focusMessagesDialogUAVSelectorFieldSignal,
  mapRotationResetSignal,
} from './signals';
import store, { clearStore } from './store';
import { takeoffUAVs, landUAVs, returnToHomeUAVs } from './utils/messaging';
import { Tool } from './views/map/tools';

export default [
  // Drone selection hotkeys
  {
    description: 'Select all drones',
    on: 'down',
    keys: 'PlatMod + KeyA',
    action: () => {
      store.dispatch(selectAllUAVFeatures());
    },
  },
  {
    description: 'Clear selection',
    on: 'down',
    keys: 'PlatMod + Shift + KeyA',
    action: () => {
      store.dispatch(clearSelection());
    },
  },

  // Tool hotkeys
  {
    description: 'Switch to Select tool',
    on: 'down',
    keys: 'PlatMod + KeyS',
    action: () => {
      store.dispatch(selectMapTool(Tool.SELECT));
    },
  },
  {
    description: 'Switch to Zoom tool',
    on: 'down',
    keys: 'PlatMod + KeyZ',
    action: () => {
      store.dispatch(selectMapTool(Tool.ZOOM));
    },
  },
  {
    description: 'Switch to Pan tool',
    on: 'down',
    keys: 'PlatMod + KeyP',
    action: () => {
      store.dispatch(selectMapTool(Tool.PAN));
    },
  },

  // Copy the actual coordinates of the cursor
  {
    description: 'Copy coordinates to clipboard',
    on: 'down',
    keys: 'PlatMod + Shift + KeyC',
    action: () => {
      const displays = document.querySelectorAll('.ol-mouse-position');
      const text =
        displays && displays.length > 0 ? displays[0].textContent : undefined;
      if (text) {
        copy(text.split('\n')[0]);
        store.dispatch(showNotification('Coordinates copied to clipboard.'));
      }
    },
  },

  // Map view adjustment hotkeys
  {
    description: 'Reset map rotation',
    on: 'down',
    keys: 'PlatMod + KeyR',
    action: () => {
      mapRotationResetSignal.dispatch();
    },
  },
  /*
  {
    description: 'Fit all features into view',
    on: 'down',
    keys: 'PlatMod + KeyF',
    action: () => {
      fitAllFeaturesSignal.dispatch();
    },
  },
  */

  {
    description: 'Open the Layers dialog',
    on: 'down',
    keys: 'PlatMod + Shift + KeyL',
    action: () => {
      store.dispatch(showLayersDialog());
    },
  },

  // UAV Control hotkeys
  {
    description: 'Issue TAKEOFF command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyT',
    action: () => takeoffUAVs(getSelectedUAVIds(store.getState())),
  },
  {
    description: 'Issue LAND command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyL',
    action: () => landUAVs(getSelectedUAVIds(store.getState())),
  },
  {
    description: 'Issue RTH (Return To Home) command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyR',
    action: () => returnToHomeUAVs(getSelectedUAVIds(store.getState())),
  },

  // Messages dialog related hotkeys
  {
    description: 'Open the Messages dialog',
    on: 'down',
    keys: '@',
    action: () => {
      store.dispatch(showMessagesDialog());
      focusMessagesDialogUAVSelectorFieldSignal.dispatch();
    },
  },

  // Clear stored settings and reload
  {
    description: 'Clear stored settings and reload',
    on: 'down',
    keys: 'PlatMod + Alt + KeyC',
    action: async () => {
      if (window.confirm('Are you sure? All settings will be lost.')) {
        await clearStore();
        window.location.reload();
      }
    },
  },
];
