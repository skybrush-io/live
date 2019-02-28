/**
 * @file Action factories related to the saved locations.
 */

import { createAction } from 'redux-actions'

import { debounced } from './meta'
import {
  ADD_SAVED_LOCATION, CREATE_NEW_SAVED_LOCATION,
  DELETE_SAVED_LOCATION, UPDATE_SAVED_LOCATION
} from './types'

/**
 * Action factory that creates an action that will update the properties
 * of a given saved location or add a new one, in a debounced manner.
 *
 * @param {object} savedLocation the descriptor of the edited saved location.
 */
export const debouncedUpdateSavedLocation = createAction(
  UPDATE_SAVED_LOCATION,
  savedLocation => ({ savedLocation }),
  debounced()
)

/**
 * Action factory that creates an action that will add a new saved location.
 *
 * @param {object} savedLocation the descriptor of the new saved location.
 */
export const addSavedLocation = createAction(
  ADD_SAVED_LOCATION,
  savedLocation => ({ savedLocation })
)

/**
 * Action factory that creates an action that creates a new saved location to
 * be added to the list of saved locations.
 */
export const createNewSavedLocation = createAction(
  CREATE_NEW_SAVED_LOCATION
)

/**
 * Action factory that creates an action that will delete
 * a given saved location.
 *
 * @param {Number} savedLocationId the identifier of the saved location
 * to be deleted.
 */
export const deleteSavedLocation = createAction(
  DELETE_SAVED_LOCATION,
  savedLocationId => ({ savedLocationId })
)

/**
 * Action factory that creates an action that will update the properties
 * of a given saved location.
 *
 * @param {object} savedLocation the descriptor of the edited saved location.
 *        It must have a key named `id` so we can identify which saved location
 *        to update in the store.
 */
export const updateSavedLocation = createAction(
  UPDATE_SAVED_LOCATION,
  savedLocation => ({ savedLocation })
)
