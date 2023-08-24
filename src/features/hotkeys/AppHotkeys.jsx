/**
 * @file File for storing hotkey configuration.
 */

import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import React from 'react';
import { configure as configureHotkeys, GlobalHotKeys } from 'react-hotkeys';
import { connect } from 'react-redux';

import { selectAllUAVs } from '~/features/map/selection';
import { removeSelectedFeatures } from '~/features/map-features/actions';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { toggleMissionIds } from '~/features/settings/slice';
import { toggleBroadcast } from '~/features/session/actions';
import { isBroadcast } from '~/features/session/selectors';
import { requestRemovalOfSelectedUAVs } from '~/features/uavs/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getSelectedUAVIds, getUAVIdList } from '~/features/uavs/selectors';
import { clearStoreAfterConfirmation } from '~/store';
import { createUAVOperationThunks } from '~/utils/messaging';

import {
  appendToPendingUAVId,
  clearSelectionOrPendingUAVId,
  copyCoordinates,
  deleteLastCharacterOfPendingUAVId,
  handlePendingUAVIdThenDispatch,
} from './actions';
import keyMap from './keymap';
import {
  isKeyboardNavigationActive,
  sendKeyboardNavigationSignal,
} from './signal';
import { showHotkeyDialog } from './slice';

configureHotkeys({
  // This is necessary to ensure that the appropriate handlers are triggered
  // when digit keys are pressed in rapid succession; otherwise it can happen
  // that the keydown event of the second key is triggered before the keyup
  // event of the first key, and react-hotkeys would then be evaluating the
  // key combination only
  allowCombinationSubmatches: true,

  // Make sure that repeated key-down events are triggered when the user holds
  // down the arrow keys for a longer period
  ignoreRepeatedEventsWhenKeyHeldDown: false,

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

/**
 * Object that maps common UAV operation names (`shutdown`, `takeOff` etc) to
 * action thunks that execute the given UAV operation on the current selection.
 */
const uavOperationThunks = createUAVOperationThunks({
  getTargetedUAVIds(state) {
    return isBroadcast(state) ? getUAVIdList(state) : getSelectedUAVIds(state);
  },
  // getTargetedUAVIds: getSelectedUAVIds,
  getTransportOptions(state) {
    const broadcast = isBroadcast(state);
    const channel = getPreferredCommunicationChannelIndex(state);
    return { broadcast, channel: channel || 0 };
  },
});

const callUAVActionOnSelection = (actionName) => () => {
  const func = uavOperationThunks[actionName];
  if (func && typeof func === 'function') {
    return func();
  } else {
    console.warn(`Attempted to perform unknown action: ${actionName}`);
    return () => {};
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
        ACTIVATE_SELECTION: handlePendingUAVIdThenDispatch(
          () => (dispatch, getState) => {
            if (isKeyboardNavigationActive()) {
              sendKeyboardNavigationSignal('ACTIVATE_SELECTION')();
            } else {
              const selectedUAVIds = getSelectedUAVIds(getState());
              if (selectedUAVIds && selectedUAVIds.length > 0) {
                dispatch(openUAVDetailsDialog(selectedUAVIds.at(-1)));
              }
            }
          },
          { executeOnlyWithoutPendingUAVId: true }
        ),
        CLEAR_SELECTION: clearSelectionOrPendingUAVId,
        COPY_COORDINATES: copyCoordinates,
        DELETE_LAST_CHARACTER: deleteLastCharacterOfPendingUAVId,
        REMOVE_SELECTION: handlePendingUAVIdThenDispatch(() => (dispatch) => {
          dispatch(requestRemovalOfSelectedUAVs());
          dispatch(removeSelectedFeatures());
        }),
        SELECT_ALL_DRONES: selectAllUAVs,
        SEND_FLASH_LIGHTS_COMMAND: handlePendingUAVIdThenDispatch(
          callUAVActionOnSelection('flashLight')
        ),
        SEND_TAKEOFF_COMMAND: callUAVActionOnSelection('takeOff'),
        SEND_LANDING_COMMAND: callUAVActionOnSelection('land'),
        SEND_POSITION_HOLD_COMMAND: callUAVActionOnSelection('holdPosition'),
        SEND_RTH_COMMAND: callUAVActionOnSelection('returnToHome'),
        SHOW_HOTKEY_DIALOG: showHotkeyDialog,
        TOGGLE_BROADCAST_MODE: toggleBroadcast,
        TOGGLE_SORT_BY_MISSION_ID: toggleMissionIds,
        TYPE_0: () => appendToPendingUAVId(0),
        TYPE_1: () => appendToPendingUAVId(1),
        TYPE_2: () => appendToPendingUAVId(2),
        TYPE_3: () => appendToPendingUAVId(3),
        TYPE_4: () => appendToPendingUAVId(4),
        TYPE_5: () => appendToPendingUAVId(5),
        TYPE_6: () => appendToPendingUAVId(6),
        TYPE_7: () => appendToPendingUAVId(7),
        TYPE_8: () => appendToPendingUAVId(8),
        TYPE_9: () => appendToPendingUAVId(9),
        TYPE_S: () => appendToPendingUAVId('s'),
      },
      // Plain callable functions bound to hotkeys
      {
        CLEAR_STORED_SETTINGS: clearStoreAfterConfirmation,
        PAGE_DOWN: sendKeyboardNavigationSignal('PAGE_DOWN'),
        PAGE_UP: sendKeyboardNavigationSignal('PAGE_UP'),
        SELECT_FIRST: sendKeyboardNavigationSignal('SELECT_FIRST'),
        SELECT_LAST: sendKeyboardNavigationSignal('SELECT_LAST'),
        SELECT_DOWN: sendKeyboardNavigationSignal('SELECT_DOWN'),
        SELECT_UP: sendKeyboardNavigationSignal('SELECT_UP'),
        SELECT_LEFT: sendKeyboardNavigationSignal('SELECT_LEFT'),
        SELECT_RIGHT: sendKeyboardNavigationSignal('SELECT_RIGHT'),
      },
      dispatch
    ),
  })
)(AppHotkeys);
