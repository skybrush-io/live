/**
 * @file File for storing hotkey configuration.
 */

import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import React from 'react';
import { configure as configureHotkeys, HotKeys } from 'react-hotkeys';
import { connect } from 'react-redux';

import { selectAllUAVFeatures, clearSelection } from '~/actions/map';
import { clearStoreAfterConfirmation } from '~/store';
import { takeoffUAVs, landUAVs, returnToHomeUAVs } from '~/utils/messaging';

import { copyCoordinates } from './actions';
import keyMap from './keymap';
import { showHotkeyDialog } from './slice';
import { callOnSelection } from './utils';

configureHotkeys({
  // This is necessary to ensure that the appropriate handlers are triggered
  // when digit keys are pressed in rapid succession; otherwise it can happen
  // that the keydown event of the second key is triggered before the keyup
  // event of the first key, and react-hotkeys would then be evaluating the
  // key combination only
  allowCombinationSubmatches: true,
});

const AppHotkeys = ({ children, handlers }) => (
  <HotKeys root keyMap={keyMap} handlers={handlers}>
    {children}
  </HotKeys>
);

const bindHotkeyHandlers = (reduxHandlers, nonReduxHandlers, dispatch) => ({
  ...nonReduxHandlers,
  ...mapValues(reduxHandlers, (handler) => (event) => {
    event.preventDefault();
    dispatch(handler());
  }),
});

AppHotkeys.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  handlers: PropTypes.object,
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
        SEND_TAKEOFF_COMMAND: callOnSelection(takeoffUAVs),
        SEND_LANDING_COMMAND: callOnSelection(landUAVs),
        SEND_RTH_COMMAND: callOnSelection(returnToHomeUAVs),
        SHOW_HOTKEY_DIALOG: showHotkeyDialog,
      },
      // Plain callable functions bound to hotkeys
      {
        CLEAR_STORED_SETTINGS: clearStoreAfterConfirmation,
      },
      dispatch
    ),
  })
)(AppHotkeys);
