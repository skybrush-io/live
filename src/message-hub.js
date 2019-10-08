/**
 * @file
 * The single applicaiton-wide message hub that other objects can use to
 * send messages to the connected Flockwave server.
 */

import MessageHub from './flockwave/messages';

import { handleClockInformationMessage } from './model/clocks';
import { handleConnectionInformationMessage } from './model/connections';
import flock from './flock';
import store from './store';

const { dispatch } = store;

/**
 * The single application-wide message hub that other objects can use to
 * send messages to the connected Flockwave server.
 *
 * Note that you need to connect the hub to a Socket.IO socket first before
 * using it.
 *
 * @type {MessageHub}
 */
const messageHub = new MessageHub();
messageHub.registerNotificationHandlers({
  'CLK-INF': message => handleClockInformationMessage(message.body, dispatch),
  'CONN-INF': message =>
    handleConnectionInformationMessage(message.body, dispatch),
  'UAV-INF': message =>
    flock.handleUAVInformationMessage(message.body, dispatch)
});

export default messageHub;
