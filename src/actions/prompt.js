/**
 * @file Action factories related to the global prompt dialog.
 */

import { createAction } from 'redux-actions'

import { CANCEL_PROMPT_DIALOG, SHOW_PROMPT_DIALOG, SUBMIT_PROMPT_DIALOG } from './types'

/**
 * Function that must be called from the submission thunk to resolve the
 * promise created earlier in the ``showPromptDialog()`` thunk.
 */
let _resolver

/**
 * Helper function that calls the resolver function with the given value
 * if we have a resolver function, and does nothing otherwise.
 *
 * @param  {string}  value  the value to call the resolver with
 */
function resolveTo (value) {
  if (_resolver !== undefined) {
    _resolver(value)
    _resolver = undefined
  }
}

/**
 * Action factory that creates an action that closes the prompt dialog
 * without submitting anything.
 *
 * This is not exported because the thunk version should be used instead.
 */
const cancelPromptDialogNow = createAction(CANCEL_PROMPT_DIALOG)

/**
 * Thunk factoty that creates a thunk that closes the prompt dialog
 * without submitting anything, and resolves the promise of the prompt
 * dialog to undefined.
 *
 * @returns  {function}  a Redux thunk
 */
export function cancelPromptDialog () {
  return dispatch => {
    dispatch(cancelPromptDialogNow())
    resolveTo(undefined)
  }
}

/**
 * Action factory that creates an action that submits the prompt dialog
 * with the given value.
 *
 * This is not exported because the thunk version should be used instead.
 */
const submitPromptDialogNow = createAction(
  SUBMIT_PROMPT_DIALOG,
  value => ({ value })
)

/**
 * Thunk factory that creates a thunk that submits the prompt dialog
 * with the given value.
 *
 * @param  {string}  value  the value to submit from the dialog
 * @return {function} a Redux thunk
 */
export function submitPromptDialog (value) {
  if (value === undefined) {
    return cancelPromptDialog()
  } else {
    return dispatch => {
      dispatch(submitPromptDialogNow())
      resolveTo(value)
    }
  }
}

/**
 * Action factory that creates an action that will show the prompt dialog.
 * This is not exported because the thunk version should be used instead.
 */
const showPromptDialogNow = createAction(
  SHOW_PROMPT_DIALOG,
  (message, options) => {
    if (typeof options === 'string') {
      options = {
        initialValue: options
      }
    }
    return { ...options, message }
  }
)

/**
 * Thunk factory that creates a thunk that shows the prompt dialog.
 *
 * @param  {string}  message  the message to show in the dialog
 * @param  {Object}  options  additional options to pass to the dialog
 * @return {function} a Redux thunk
 */
export function showPromptDialog (message, options) {
  return dispatch => {
    resolveTo(undefined)
    dispatch(showPromptDialogNow(message, options))
    return new Promise(resolve => {
      _resolver = resolve
    })
  }
}
