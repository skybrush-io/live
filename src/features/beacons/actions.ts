import { setSelection } from '~/features/map/selection';
import { beaconIdToGlobalId } from '~/model/identifiers';

/**
 * Action factory that creates an action that sets the set of selected
 * beacon IDs in the map.
 *
 * @param ids  The IDs of the selected beacons. Any beacon whose ID is
 *        not in this set will be deselected, and so will be any feature
 *        that is not a beacon.
 */
export const setSelectedBeaconIds = (ids: string[]) =>
  setSelection(ids.map(beaconIdToGlobalId));
