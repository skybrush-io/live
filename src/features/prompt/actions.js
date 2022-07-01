/**
 * @file Action factories related to the global prompt dialog.
 */

import { actions } from './slice';

const { _cancelPromptDialog, _showPromptDialog, _submitPromptDialog } = actions;

/**
 * Function that must be called from the submission thunk to resolve the
 * promise created earlier in the ``showPromptDialog()`` thunk.
 */
let _resolver;

/**
 * Helper function that calls the resolver function with the given value
 * if we have a resolver function, and does nothing otherwise.
 *
 * @param  {string}  value  the value to call the resolver with
 */
function resolveTo(value) {
  if (_resolver !== undefined) {
    _resolver(value);
    _resolver = undefined;
  }
}

/**
 * Thunk factory that creates a thunk that closes the prompt dialog
 * without submitting anything, and resolves the promise of the prompt
 * dialog to undefined.
 *
 * @returns  {function}  a Redux thunk
 */
export function cancelPromptDialog() {
  return (dispatch) => {
    dispatch(_cancelPromptDialog());
    resolveTo(undefined);
  };
}

/**
 * Thunk factory that creates a thunk that submits the prompt dialog
 * with the given value.
 *
 * @param  {string}  value  the value to submit from the dialog
 * @return {function} a Redux thunk
 */
export function submitPromptDialog(value) {
  if (value === undefined) {
    return cancelPromptDialog();
  }

  return (dispatch) => {
    dispatch(_submitPromptDialog());
    resolveTo(value);
  };
}

/**
 * Thunk factory that creates a thunk that shows the prompt dialog.
 *
 * @param  {string}  message  the message to show in the dialog
 * @param  {Object}  options  additional options to pass to the dialog
 * @return {function} a Redux thunk
 */
export function showPromptDialog(message, options) {
  return (dispatch) => {
    resolveTo(undefined);
    dispatch(_showPromptDialog(message, options));
    return new Promise((resolve) => {
      _resolver = resolve;
    });
  };
}
