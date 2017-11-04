import { isNil, reject } from 'lodash'
import { createSelector } from 'reselect'

import { featureIdToUavId } from './model/identifiers'

/**
 * Selector that retrieves the list of selected feature IDs from the
 * state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
const getSelectedFeatureIds = state => state.map.selection

/**
 * Selector that calculates and caches the list of selected UAV IDs from
 * the state object.
 */
export const getSelectedUAVIds = createSelector(
  getSelectedFeatureIds,
  selectedFeatureIds => (
    reject(selectedFeatureIds.map(featureIdToUavId), isNil)
  )
)
