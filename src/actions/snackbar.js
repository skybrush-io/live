/**
 * @file Action factories related to the global app snackbar.
 */

import { createAction } from 'redux-actions'
import { SHOW_SNACKBAR_MESSAGE } from './types'

/**
 * Action factory that creates an action that makes the UI show a new
 * message in the snackbar.
 */
export const showSnackbarMessage = createAction(SHOW_SNACKBAR_MESSAGE)
