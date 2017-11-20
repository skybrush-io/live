/**
 * @file Action factories related to the management of features on the map.
 */

import { createAction } from 'redux-actions'
import { ADD_FEATURE, REMOVE_FEATURES, RENAME_FEATURE,
  TRANSLATE_FEATURES } from './types'

/**
 * Action factory that creates an action that adds a new feature to the map.
 *
 * @param {Object}  feature  the feature object to add
 */
export const addFeature = createAction(ADD_FEATURE,
  feature => ({ feature })
)

/**
 * Action factory that creates an action that removes a feature from the map.
 *
 * @param {string}  id  the ID of the feature to remove
 */
export const removeFeature = createAction(REMOVE_FEATURES,
  id => ({ ids: [id] })
)

/**
 * Action factory that creates an action that renames a feature on the map.
 *
 * @param {string}  id  the ID of the feature to name
 * @param {string}  name  the new name of the feature
 */
export const renameFeature = createAction(RENAME_FEATURE,
  (id, name) => ({ id, name })
)

/**
 * Action factory that creates an action that removes multiple features
 * from the map.
 *
 * @param {string[]}  ids  the IDs of the features to remove
 */
export const removeFeatures = createAction(REMOVE_FEATURES,
  ids => ({ ids })
)

/**
 * Action factory that creates an action that moves some features on the map.
 *
 * @param {Object}  displacements  an object mapping feature IDs to their
 *        desired displacements on the map as OpenLayers coordinates
 */
export const translateFeatures = createAction(TRANSLATE_FEATURES,
  displacements => ({ displacements })
)
