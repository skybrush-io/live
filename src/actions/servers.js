/**
 * @file Action factories related to the management of detected servers.
 */

import { createAction } from 'redux-actions'
import {
  ADD_DETECTED_SERVER,
  REMOVE_ALL_DETECTED_SERVERS,
  START_SCANNING,
  STOP_SCANNING,
  UPDATE_DETECTED_SERVER_LABEL
} from './types'

/**
 * Action factory that creates an action that adds a detected server to the
 * list of detected servers in the server registry.
 *
 * The action will receive a property named `key` when the addition is
 * completed; this will contain an opaque identifier that can be used later
 * in other actions to refer to the entry that was just created.
 */
export const addDetectedServer = createAction(ADD_DETECTED_SERVER,
  (hostName, port) => ({ hostName, port, type: 'detected' })
)

/**
 * Action factory that creates an action that adds a server whose settings
 * were inferred in the absence of a reliable detection mechanism (such as
 * SSDP) to the list of detected servers in the server registry.
 *
 * The action will receive a property named `key` when the addition is
 * completed; this will contain an opaque identifier that can be used later
 * in other actions to refer to the entry that was just created.
 */
export const addInferredServer = createAction(ADD_DETECTED_SERVER,
  (hostName, port) => ({ hostName, port, type: 'inferred' })
)

/**
 * Action factory that creates an action that removes all the previously
 * detected servers from the server registry.
 */
export const removeAllDetectedServers = createAction(REMOVE_ALL_DETECTED_SERVERS)

/**
 * Action factory that creates an action that notifies the store that the
 * scanning for servers has started.
 */
export const startScanning = createAction(START_SCANNING)

/**
 * Action factory that creates an action that notifies the store that the
 * scanning for servers has stopped.
 */
export const stopScanning = createAction(STOP_SCANNING)

/**
 * Updates the displayed label of a detected server.
 */
export const updateDetectedServerLabel = createAction(
  UPDATE_DETECTED_SERVER_LABEL,
  (key, label) => ({ key, label })
)
