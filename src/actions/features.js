/**
 * @file Action factories related to the management of features on the map.
 */

import { createAction } from 'redux-actions'
import { ADD_FEATURE, REMOVE_FEATURES, RENAME_FEATURE,
  UPDATE_FEATURE_COORDINATES } from './types'

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
 * Action factory that creates an action that updates the coordinates of
 * some features on the map.
 *
 * @param {Object}  coordinates  an object mapping feature IDs to their
 *        new coordinates on the map
 */
export const updateFeatureCoordinates = createAction(UPDATE_FEATURE_COORDINATES,
  coordinates => ({ coordinates })
)
