/**
 * @file Action factories related to the dialog that shows the feature
 * editor.
 */

import { createAction } from 'redux-actions';
import {
  SHOW_FEATURE_EDITOR_DIALOG,
  CLOSE_FEATURE_EDITOR_DIALOG,
  SET_FEATURE_EDITOR_DIALOG_TAB
} from './types';

/**
 * Action factory that creates an action that will close the feature editor
 * dialog.
 */
export const closeFeatureEditorDialog = createAction(
  CLOSE_FEATURE_EDITOR_DIALOG
);

/**
 * Action factory that creates an action that will show the feature editor
 * dialog.
 *
 * The single argument to the action must be the identifier of the feature
 * to be edited in the dialog.
 */
export const showFeatureEditorDialog = createAction(SHOW_FEATURE_EDITOR_DIALOG);

/**
 * Action factory that creates an action that will set the selected tab in the
 * feature editor dialog.
 */
export const setFeatureEditorDialogTab = createAction(
  SET_FEATURE_EDITOR_DIALOG_TAB
);
