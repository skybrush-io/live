/**
 * @file File for storing hotkey configuration.
 */

import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import React from 'react';
import { configure as configureHotkeys, GlobalHotKeys } from 'react-hotkeys';
import { connect } from 'react-redux';

import { selectAllUAVFeatures, clearSelection } from '~/actions/map';
import { getUAVCommandTriggers } from '~/features/uavs/selectors';
import { clearStoreAfterConfirmation } from '~/store';

import { copyCoordinates } from './actions';
import keyMap from './keymap';
import keyboardNavigationSignal from './signal';
import { showHotkeyDialog } from './slice';

configureHotkeys({
  // This is necessary to ensure that the appropriate handlers are triggered
  // when digit keys are pressed in rapid succession; otherwise it can happen
  // that the keydown event of the second key is triggered before the keyup
  // event of the first key, and react-hotkeys would then be evaluating the
  // key combination only
  allowCombinationSubmatches: true,

  // Uncomment the next line for debugging problems with hotkeys
  // logLevel: 'debug',
});

// We use GlobalHotKeys here because the plain HotKeys component does not
// play nicely with multiple React root components; hotkeys defined in one of
// the root component may overwrite others when we try to retrieve the
// application keymap from react-hotkeys. This is because react-hotkeys fails
// to link the hotKeyParentId property of one <HotKeys> component to another
// if they are in different React root components.
//
// Luckily it is not a problem if we use GlobalHotKeys "outside" the workbench
// and normal <HotKeys> "inside" the workbench.

const AppHotkeys = ({ handlers }) => (
  <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
);

const bindHotkeyHandlers = (reduxHandlers, nonReduxHandlers, dispatch) => ({
  ...nonReduxHandlers,
  ...mapValues(reduxHandlers, (handler) => (event) => {
    event.preventDefault();
    dispatch(handler());
  }),
});

AppHotkeys.propTypes = {
  handlers: PropTypes.object,
};

const sendKeyboardNavigationSignal = (action) => (event) =>
  keyboardNavigationSignal.dispatch(action, event);

const callUAVActionOnSelection = (actionName) => () => (dispatch, getState) => {
  const actions = getUAVCommandTriggers(getState());
  const action = actions[actionName];

  if (action) {
    action();
  } else {
    console.warn(`Attempted to perform unknown action: ${actionName}`);
  }
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch) => ({
    handlers: bindHotkeyHandlers(
      // Redux actions bound to hotkeys
      {
        CLEAR_SELECTION: clearSelection,
        COPY_COORDINATES: copyCoordinates,
        SELECT_ALL_DRONES: selectAllUAVFeatures,
        SEND_FLASH_LIGHTS_COMMAND: callUAVActionOnSelection('flashLightOnUAVs'),
        SEND_TAKEOFF_COMMAND: callUAVActionOnSelection('takeoffUAVs'),
        SEND_LANDING_COMMAND: callUAVActionOnSelection('landUAVs'),
        SEND_RTH_COMMAND: callUAVActionOnSelection('returnToHomeUAVs'),
        SHOW_HOTKEY_DIALOG: showHotkeyDialog,
      },
      // Plain callable functions bound to hotkeys
      {
        CLEAR_STORED_SETTINGS: clearStoreAfterConfirmation,
        PAGE_DOWN: sendKeyboardNavigationSignal('PAGE_DOWN'),
        PAGE_UP: sendKeyboardNavigationSignal('PAGE_UP'),
        SELECT_FIRST: sendKeyboardNavigationSignal('SELECT_FIRST'),
        SELECT_LAST: sendKeyboardNavigationSignal('SELECT_LAST'),
        SELECT_NEXT: sendKeyboardNavigationSignal('SELECT_NEXT'),
        SELECT_PREVIOUS: sendKeyboardNavigationSignal('SELECT_PREVIOUS'),
      },
      dispatch
    ),
  })
)(AppHotkeys);
