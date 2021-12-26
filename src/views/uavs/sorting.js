import mapValues from 'lodash-es/mapValues';
import memoize from 'memoizee';
import { orderBy } from 'natural-orderby';
import { getKeyFunctionForUAVSortKey } from '~/model/sorting';

export { getUAVListSortPreference as getSecondarySortPreference } from '~/features/settings/selectors';

// Helper functions related to sorting and filtering the UAVs list

function reversedValues(object) {
  return mapValues(object, (array) => array.concat().reverse());
}

/**
 * Returns a Lodash sorting function factory given a sort key. The returned
 * function must be called with a UAV-ID-to-state mapping and it will return
 * another function that can be used to sort an array of UAV IDs based on
 * the given sorting key. Returns undefined if there is no need to sort the UAVs
 * given the sort key.
 */
const getSortFunctionForKey = memoize((key) => {
  const getter = getKeyFunctionForUAVSortKey(key);
  return (uavsByIds) => (uavIdAndMissionId) =>
    getter(uavsByIds[uavIdAndMissionId[0]]);
});

export function applySecondarySortPreference(
  sort,
  uavIdsBySections,
  uavsByIds
) {
  const { key, reverse } = sort || {};
  if (uavsByIds) {
    // Use lodash to sort all values in uavIdsBySections
    const func = getSortFunctionForKey(key);
    return mapValues(uavIdsBySections, (uavIds) => {
      return orderBy(uavIds, [func(uavsByIds)], [reverse ? 'desc' : 'asc']);
    });
  } else {
    // No need to sort, but we may need to reverse the arrays
    return reverse ? reversedValues(uavIdsBySections) : uavIdsBySections;
  }
}
