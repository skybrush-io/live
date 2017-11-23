/**
 * @file Reducer function for handling the metadata of the state object
 */

import { handleActions } from 'redux-actions'

/**
 * Default content of the metadata in the state object.
 */
const defaultState = {
  schemaVersion: 1
}

/**
 * The reducer function that handles actions related to the metadata.
 */
const reducer = handleActions({}, defaultState)

export default reducer
