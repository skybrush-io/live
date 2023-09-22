/**
 * @file
 * The single applicaiton-wide message hub that other objects can use to
 * send messages to the connected Skybrush server.
 */

import isEmpty from 'lodash-es/isEmpty';
import { batch } from 'react-redux';

import { handleDebugRequest } from './debugging';

import MessageHub from './flockwave/messages';

import { handleBeaconInformationMessage } from './model/beacons';
import { handleClockInformationMessage } from './model/clocks';
import { handleDockInformationMessage } from './model/docks';
import {
  handleConnectionDeletionMessage,
  handleConnectionInformationMessage,
} from './model/connections';
import { handleObjectDeletionMessage } from './model/objects';

import { addInboundMessage } from './features/messages/slice';
import { showError, showNotification } from './features/snackbar/actions';
import { semanticsFromSeverity } from './features/snackbar/utils';

import flock from './flock';
import store from './store';

const { dispatch, getState } = store;

/**
 * The single application-wide message hub that other objects can use to
 * send messages to the connected Skybrush server.
 *
 * Note that you need to connect the hub to a Socket.IO socket first before
 * using it.
 *
 * @type {MessageHub}
 */
const messageHub = new MessageHub();

/* eslint-disable object-shorthand */
messageHub.registerNotificationHandlers({
  'BCN-INF': (message) =>
    handleBeaconInformationMessage(message.body, dispatch, getState),
  'CLK-INF': (message) => handleClockInformationMessage(message.body, dispatch),
  'CONN-DEL': (message) =>
    handleConnectionDeletionMessage(message.body, dispatch),
  'CONN-INF': (message) =>
    handleConnectionInformationMessage(message.body, dispatch),
  'DOCK-INF': (message) => handleDockInformationMessage(message.body, dispatch),
  'OBJ-DEL': (message) => handleObjectDeletionMessage(message.body, dispatch),
  'SYS-CLOSE': (message) => {
    if (message.body && message.body.reason) {
      dispatch(showError(message.body.reason));
    }
  },
  'SYS-MSG': (message) => {
    if (message.body && Array.isArray(message.body.items)) {
      batch(() => {
        for (const item of message.body.items) {
          if (isEmpty(item.sender)) {
            // This message came directly from the server so we show it as a
            // notification
            dispatch(
              showNotification({
                message: item.message,
                semantics: semanticsFromSeverity(item.severity),
              })
            );
          } else {
            // This message probably came from a UAV so let's add it to the
            // list of messages received from the UAV
            dispatch(
              addInboundMessage({
                message: item.message,
                uavId: item.sender,
                severity: item.severity,
              })
            );
          }
        }
      });
    }
  },
  'UAV-INF': (message) =>
    flock.handleUAVInformationMessage(message.body, dispatch),
  'X-DBG-REQ': (message) =>
    handleDebugRequest(message.body, messageHub.execute.sendDebugMessage),
});
/* eslint-enable object-shorthand */

export default messageHub;
