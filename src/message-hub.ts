/**
 * @file
 * The single application-wide message hub that other objects can use to
 * send messages to the connected Skybrush server.
 */

import type {
  Notification_CONNDEL,
  Notification_OBJDEL,
  Notification_SYSCLOSE,
  Notification_SYSMSG,
  Response_BCNINF,
  Response_CLKINF,
  Response_CONNINF,
  Response_DOCKINF,
  Response_UAVINF,
} from '@skybrush/flockwave-spec';

import { handleDebugRequest } from './debugging';

import MessageHub from './flockwave/messages';
import type { Message } from './flockwave/types';

import { handleBeaconInformationMessage } from './model/beacons';
import { handleClockInformationMessage } from './model/clocks';
import {
  handleConnectionDeletionMessage,
  handleConnectionInformationMessage,
} from './model/connections';
import { handleDockInformationMessage } from './model/docks';
import { handleObjectDeletionMessage } from './model/objects';

import { batchAddInboundMessages } from './features/messages/slice';
import { showError, showNotification } from './features/snackbar/actions';
import { semanticsFromSeverity } from './features/snackbar/utils';
import type { Severity } from './model/enums';

import React from 'react';
import flock from './flock';
import store from './store';

const { dispatch } = store;

/**
 * The single application-wide message hub that other objects can use to
 * send messages to the connected Skybrush server.
 *
 * Note that you need to connect the hub to a Socket.IO socket first before
 * using it.
 */
const messageHub = new MessageHub();

messageHub.registerNotificationHandlers({
  'BCN-INF': (message: Message<Response_BCNINF>) =>
    handleBeaconInformationMessage(message.body, dispatch),
  'CLK-INF': (message: Message<Response_CLKINF>) =>
    handleClockInformationMessage(message.body, dispatch),
  'CONN-DEL': (message: Message<Notification_CONNDEL>) =>
    handleConnectionDeletionMessage(message.body, dispatch),
  'CONN-INF': (message: Message<Response_CONNINF>) =>
    handleConnectionInformationMessage(message.body, dispatch),
  'DOCK-INF': (message: Message<Response_DOCKINF>) =>
    handleDockInformationMessage(message.body, dispatch),
  'OBJ-DEL': (message: Message<Notification_OBJDEL>) =>
    handleObjectDeletionMessage(message.body, dispatch),
  'SYS-CLOSE': (message: Message<Notification_SYSCLOSE>) => {
    if (message.body?.reason) {
      showError(message.body.reason);
    }
  },
  'SYS-MSG': (message: Message<Notification_SYSMSG>) => {
    // TODO: remove this guard. The typing enforces that the value
    // is an array, but it's safer to keep it for a while to avoid
    // accidentally breaking something.
    if (!Array.isArray(message?.body?.items)) {
      return;
    }

    const fromUAV: Parameters<typeof batchAddInboundMessages>[0] = [];

    for (const item of message.body.items) {
      if (!item.sender) {
        // This message came directly from the server so we show it as a
        // notification
        showNotification({
          message: item.message,
          semantics: semanticsFromSeverity(item.severity),
        });
      } else {
        // This message probably came from a UAV so let's add it to the
        // list of messages received from the UAV
        fromUAV.push({
          message: item.message,
          uavId: item.sender,
          severity: item.severity as Severity | undefined,
        });
      }
    }

    dispatch(batchAddInboundMessages(fromUAV));
  },
  'UAV-INF': (message: Message<Response_UAVINF>) =>
    flock.handleUAVInformationMessage(message.body),
  'X-DBG-REQ': (message: Message<{ data?: string }>) => {
    void handleDebugRequest(message.body, messageHub.execute.sendDebugMessage);
  },
});

/**
 * React context that exposes the workbench instance to components.
 */
export const MessageHubContext = React.createContext(messageHub);

export default messageHub;
