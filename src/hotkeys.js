/**
 * @file File for storing hotkey configuration.
 */

import copy from 'copy-to-clipboard';
import { selectAllUAVFeatures, clearSelection } from './actions/map';
import { showNotification } from './features/snackbar/slice';

import { getSelectedUAVIds } from './selectors/selection';
import store, { clearStore } from './store';
import { takeoffUAVs, landUAVs, returnToHomeUAVs } from './utils/messaging';

const hotkeys = [
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
    keys: 'Escape',
    action: () => {
      store.dispatch(clearSelection());
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

export default hotkeys;
