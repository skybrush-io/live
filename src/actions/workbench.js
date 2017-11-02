/**
 * @file Action factories related to the workbench of the app.
 */

import { createAction } from 'redux-actions'
import { SAVE_WORKBENCH_STATE } from './types'

/**
 * Action factory that creates an action that saves the state of the
 * workbench.
 */
export const saveWorkbenchState = createAction(
  SAVE_WORKBENCH_STATE,
  (workbench) => workbench.getState()
)
