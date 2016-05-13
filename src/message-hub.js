/**
 * @file
 * The single applicaiton-wide message hub that other objects can use to
 * send messages to the connected Flockwave server.
 */

import MessageHub from './flockwave/messages'

/**
 * The single application-wide message hub that other objects can use to
 * send messages to the connected Flockwave server.
 *
 * Note that you need to connect the hub to a Socket.IO socket first before
 * using it.
 *
 * @type {MessageHub}
 */
const messageHub = new MessageHub()

export default messageHub
