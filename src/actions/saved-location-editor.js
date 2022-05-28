/**
 * @file Action factories related to the dialog that lets the user
 * edit properties of a saved location.
 */

import delay from 'delay';

import { actions } from '../features/saved-locations/editor.js';

export const { editSavedLocation } = actions;

const { _cancelLocationEditing, _closeSavedLocationEditorDialog } = actions;

/**
 * Action factory that creates an action that cancels the saved location editor
 * dialog and discards the changes made.
 */
export const cancelLocationEditing = () => async (dispatch) => {
  // This trickery is needed so we don't have "undefined" values briefly in the
  // saved location editor dialog when it is animated out of view
  dispatch(_closeSavedLocationEditorDialog());
  await delay(1000);
  dispatch(_cancelLocationEditing());
};
