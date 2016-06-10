/**
 * @file Action factories related to the map in the main app window.
 */

import { createAction } from 'redux-actions'
import { SELECT_MAP_TOOL } from './types'

/**
 * Action factory that creates an action that selects a given tool in the
 * map toolbar.
 */
export const selectMapTool = createAction(SELECT_MAP_TOOL)
