/**
 * @file Action factories related to the management of detected servers.
 */

import { createAction } from 'redux-actions'
import { ADD_DETECTED_SERVER, REMOVE_ALL_DETECTED_SERVERS } from './types'

/**
 * Action factory that creates an action that adds a detected server to the
 * list of detected servers in the server registry.
 */
export const addDetectedServer = createAction(ADD_DETECTED_SERVER,
  (hostName, port) => ({ hostName, port, type: 'detected' })
)

/**
 * Action factory that creates an action that adds a server whose settings
 * were inferred in the absence of a reliable detection mechanism (such as
 * SSDP) to the list of detected servers in the server registry.
 */
export const addInferredServer = createAction(ADD_DETECTED_SERVER,
  (hostName, port) => ({ hostName, port, type: 'inferred' })
)

/**
 * Action factory that creates an action that removes all the previously
 * detected servers from the server registry.
 */
export const removeAllDetectedServers = createAction(REMOVE_ALL_DETECTED_SERVERS)
