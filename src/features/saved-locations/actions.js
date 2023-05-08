/**
 * @file Action factories related to the dialog that lets the user
 * edit properties of a saved location.
 */

import delay from 'delay';

import { getEditorDialogVisibility } from './selectors';
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
export const cancelLocationEditing = () => async (dispatch, getState) => {
  // This trickery is needed so we don't have "undefined" values briefly in the
  // saved location editor dialog when it is animated out of view.
  dispatch(_closeSavedLocationEditorDialog());
  await delay(1000);
  // Check if the dialog is still closed after the delay, as the user might have
  // opened another location meanwhile, before the timeout has expired.
  if (!getEditorDialogVisibility(getState())) {
    dispatch(_cancelLocationEditing());
  }
};
