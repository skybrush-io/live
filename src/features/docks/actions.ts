import { setSelection } from '~/features/map/selection';
import { dockIdToGlobalId } from '~/model/identifiers';

/**
 * Action factory that creates an action that sets the set of selected
 * dock IDs in the map.
 *
 * @param ids  The IDs of the selected docking stations.
 *        Any docking stations whose ID is not in this set will be deselected,
 *        and so will be any feature that is not a docking station.
 * @return An appropriately constructed action.
 */
export const setSelectedDockIds = (ids: string[]) =>
  setSelection(ids.map(dockIdToGlobalId));
