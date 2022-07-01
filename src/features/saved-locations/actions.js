/**
 * @file Action factories related to the dialog that lets the user
 * edit properties of a saved location.
 */

import delay from 'delay';

import { actions } from './slice';
import { actions as editorActions } from './editor';

export const {
  addSavedLocation,
  createNewSavedLocation,
  deleteSavedLocation,
  updateSavedLocation,
} = actions;

export const { editSavedLocation } = editorActions;

const { _cancelLocationEditing, _closeSavedLocationEditorDialog } =
  editorActions;

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
