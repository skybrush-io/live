import { beaconIdToGlobalId } from '~/model/identifiers';
import { setSelectedFeatures } from '~/reducers/map/selection';

/**
 * Action factory that creates an action that sets the set of selected
 * beacon IDs in the map.
 *
 * @param {Array.<string>} ids  the IDs of the selected beacons.
 *        Any beacon whose ID is not in this set will be deselected,
 *        and so will be any feature that is not a beacon.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedBeaconIds = (ids) =>
  setSelectedFeatures(ids.map(beaconIdToGlobalId));
