/**
 * @file Action factories related to the saved locations.
 */

import { createAction } from 'redux-actions'
import { UPDATE_SAVED_LOCATION, DELETE_SAVED_LOCATION } from './types'

/**
 * Action factory that creates an action that will update the properties
 * of a given saved location or add a new one.
 *
 * @param {object} savedLocation the descriptor of the edited saved location.
 */
export const updateSavedLocation = createAction(
  UPDATE_SAVED_LOCATION,
  (savedLocation) => ({savedLocation})
)

/**
 * Action factory that creates an action that will delete
 * a given saved location.
 *
 * @param {number} savedLocationId the identifier of the saved location
 * to be deleted.
 */
export const deleteSavedLocation = createAction(
  DELETE_SAVED_LOCATION,
  (savedLocationId) => ({savedLocationId})
)
