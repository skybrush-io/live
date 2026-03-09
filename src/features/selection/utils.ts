import difference from 'lodash-es/difference';
import uniq from 'lodash-es/uniq';

import flock from '~/flock';
import { uavIdToGlobalId } from '~/model/identifiers';

/**
 * Finds all the UAV features on the map.
 *
 * @returns Array containing the feature identifiers
 */
export function findAllUAVFeatures(): string[] {
  return Object.keys(flock._uavsById).map(uavIdToGlobalId);
}

/**
 * Given an array containing a current selection, adds some items to
 * the selection and removes some items from it, then returns the same
 * selection object.
 *
 * It is assumed that removals happen first, and additions happen after
 * removals, in exactly the same order as the order in the list.
 *
 * @param current - The current selection
 * @param remove - The list of items to remove
 * @param add - The list of items to add
 * @returns The updated selection. It will always be an
 *          object that is different (identity-wise) from the current
 *          selection (even if nothing changed), and it is guaranteed that
 *          items added later will be at lower indices in the array.
 */
export function updateSelection(
  current: string[],
  add: string[],
  remove: string[] = []
): string[] {
  const result = difference(current, remove);

  if (add && add.length > 0) {
    result.splice(0, 0, ...add);
    return uniq(result);
  }

  return result;
}
