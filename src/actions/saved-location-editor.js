/**
 * @file Action factories related to the dialog that lets the user
 * edit properties of a saved location.
 */

import delay from 'delay';
import { createAction } from 'redux-actions';
import {
  EDIT_SAVED_LOCATION,
  CANCEL_LOCATION_EDITING,
  CLOSE_SAVED_LOCATION_EDITOR_DIALOG,
} from './types';

/**
 * Action factory that creates an action that will open the saved location
 * editor dialog and set the identifier of the currently edited location.
 *
 * @param {number} id  the identifier of the saved location to edit
 */
export const editSavedLocation = createAction(EDIT_SAVED_LOCATION, (id) => ({
  id,
}));

const cancelLocationEditingInner = createAction(CANCEL_LOCATION_EDITING);
const closeSavedLocationEditorDialogInner = createAction(
  CLOSE_SAVED_LOCATION_EDITOR_DIALOG
);

/**
 * Action factory that creates an action that cancels the saved location editor
 * dialog and discards the changes made.
 */
export const cancelLocationEditing = () => async (dispatch) => {
  // This trickery is needed so we don't have "undefined" values briefly in the
  // saved location editor dialog when it is animated out of view
  dispatch(closeSavedLocationEditorDialogInner());
  await delay(1000);
  dispatch(cancelLocationEditingInner());
};
