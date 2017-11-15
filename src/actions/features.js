/**
 * @file Action factories related to the management of features on the map.
 */

import { createAction } from 'redux-actions'
import { ADD_FEATURE } from './types'

/**
 * Action factory that creates an action that adds a new feature to the map.
 *
 * @param {Object}  feature  the feature object to add
 */
export const addFeature = createAction(ADD_FEATURE,
  feature => ({ feature })
)
