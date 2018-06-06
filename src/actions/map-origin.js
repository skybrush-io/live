/**
 * @file Action factories related to the origin of the map in the main
 * app window.
 */

import { createAction } from 'redux-actions'
import { CLEAR_HOME_POSITION, SET_HOME_POSITION } from './types'

/**
 * Action factory that creates an action that clears the origin (home position)
 * of the map.
 */
export const clearHomePosition = createAction(CLEAR_HOME_POSITION)

/**
 * Action factory that creates an action that clears the origin (home position)
 * of the map.
 */
export const setHomePosition = createAction(
  SET_HOME_POSITION,
  position => ({ position })
)
