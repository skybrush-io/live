/**
 * @file Action factories related to the dialog that lets the user
 * edit properties of a saved location.
 */

import { createAction } from 'redux-actions'
import { EDIT_SAVED_LOCATION, CANCEL_LOCATION_EDITING } from './types'

/**
 * Action factory that creates an action that will open the saved location
 * editor dialog and set the identifier of the currently edited location.
 *
 * @param {number} id  the identifier of the saved location to edit
 */
export const editSavedLocation = createAction(EDIT_SAVED_LOCATION,
  (id) => ({ id })
)

/**
 * Action factory that creates an action that cancels the saved location editor
 * dialog and discards the changes made.
 */
export const cancelLocationEditing = createAction(CANCEL_LOCATION_EDITING)
