/**
 * @file File for storing hotkey configuration.
 */

import copy from 'copy-to-clipboard';
import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import React from 'react';
import { configure as configureHotkeys, HotKeys } from 'react-hotkeys';
import { connect } from 'react-redux';

import { selectAllUAVFeatures, clearSelection } from './actions/map';
import { showNotification } from './features/snackbar/slice';
import { getSelectedUAVIds } from './selectors/selection';
import store, { clearStore } from './store';
import { takeoffUAVs, landUAVs, returnToHomeUAVs } from './utils/messaging';
import { isRunningOnMac } from './utils/platform';

configureHotkeys({
  // This is necessary to ensure that the appropriate handlers are triggered
  // when digit keys are pressed in rapid succession; otherwise it can happen
  // that the keydown event of the second key is triggered before the keyup
  // event of the first key, and react-hotkeys would then be evaluating the
  // key combination only
  allowCombinationSubmatches: true,
});

export const legacyHotkeys = [
  // Copy the actual coordinates of the cursor
  {
    description: 'Copy coordinates to clipboard',
    on: 'down',
    keys: 'PlatMod + Shift + KeyC',
    action: () => {
      const displays = document.querySelectorAll('.ol-mouse-position');
      const firstDisplay =
        displays && displays.length > 0 ? displays[0] : undefined;
      const textNodes = firstDisplay
        ? Array.from(firstDisplay.childNodes).filter(
            (node) => node.nodeType === Node.TEXT_NODE
          )
        : [];
      const text =
        textNodes && textNodes.length > 0
          ? textNodes[0].textContent
          : undefined;
      if (text) {
        copy(text.split('\n')[0]);
        store.dispatch(showNotification('Coordinates copied to clipboard.'));
      }
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

const keyMap = {
  CLEAR_SELECTION: {
    description: 'Clear selection',
    sequence: 'esc',
  },

  SELECT_ALL_DRONES: {
    description: 'Select all drones',
    sequence: 'mod+a',
  },
};

// We need to replace "mod" with "meta" on macOS and "ctrl" everywhere else
// until react-hotkeys starts supporting the "mod" modifier from Mousetrap
const platModKey = isRunningOnMac ? 'meta+' : 'ctrl+';
const platformize = (key) => key.replace('mod+', platModKey);
for (const definition of Object.values(keyMap)) {
  if (definition.sequence) {
    definition.sequence = platformize(definition.sequence);
  } else if (Array.isArray(definition.sequences)) {
    definition.sequences = definition.sequences.map(platformize);
  }
}

const AppHotkeys = ({ children, handlers }) => (
  <HotKeys root keyMap={keyMap} handlers={handlers}>
    {children}
  </HotKeys>
);

const bindHotkeyHandlers = (handlers, dispatch) =>
  mapValues(handlers, (handler) => (event) => {
    event.preventDefault();
    dispatch(handler());
  });

AppHotkeys.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  handlers: PropTypes.shape({
    selectAllUAVFeatures: PropTypes.func,
  }),
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch) => ({
    handlers: bindHotkeyHandlers(
      {
        CLEAR_SELECTION: clearSelection,
        SELECT_ALL_DRONES: selectAllUAVFeatures,
      },
      dispatch
    ),
  })
)(AppHotkeys);
