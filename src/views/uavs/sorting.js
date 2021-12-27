import identity from 'lodash-es/identity';
import mapValues from 'lodash-es/mapValues';
import memoize from 'memoizee';
import { orderBy } from 'natural-orderby';

import { getFilterFunctionForUAVFilter } from '~/model/filtering';
import { getKeyFunctionForUAVSortKey } from '~/model/sorting';

// Helper functions related to sorting and filtering the UAVs list

function reversedValues(object) {
  return mapValues(object, (array) => array.concat().reverse());
}

function alwaysTrue() {
  return true;
}

/**
 * Returns an array filtering functon factory given a filter identifier. The
 * returned function must be called with a UAV-ID-to-state mapping and it will
 * return another function that can be used to filter an array of UAV IDs based
 * on the given filter.
 */
const getFilterFunctionForFilterIdentifier = memoize((filterId) => {
  const filter = getFilterFunctionForUAVFilter(filterId);
  return filter
    ? (uavsByIds) => (uavIdAndMissionId) =>
        filter(uavsByIds[uavIdAndMissionId[0]])
    : () => alwaysTrue;
});

/**
 * Returns a Lodash sorting function factory given a sort key. The returned
 * function must be called with a UAV-ID-to-state mapping and it will return
 * another function that can be used to sort an array of UAV IDs based on
 * the given sorting key.
 */
const getSortFunctionForKey = memoize((key) => {
  const getter = getKeyFunctionForUAVSortKey(key);
  return getter
    ? (uavsByIds) => (uavIdAndMissionId) =>
        getter(uavsByIds[uavIdAndMissionId[0]])
    : () => identity;
});

function applyFiltersToUAVIdsBySections(filters, uavIdsBySections, uavsByIds) {
  if (filters.length === 0) {
    return uavIdsBySections;
  }

  for (const filter of filters) {
    const func = getFilterFunctionForFilterIdentifier(filter)(uavsByIds);
    uavIdsBySections = mapValues(uavIdsBySections, (uavIds) =>
      uavIds.filter(func)
    );
  }

  return uavIdsBySections;
}

function applySortCriteriaToUAVIdsBySections(
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

export function applyFiltersAndSortDisplayedUAVIdList(
  filters,
  sort,
  uavIdsBySections,
  uavsByIds
) {
  const filteredUAVIdsBySections = applyFiltersToUAVIdsBySections(
    filters,
    uavIdsBySections,
    uavsByIds
  );
  return applySortCriteriaToUAVIdsBySections(
    sort,
    filteredUAVIdsBySections,
    uavsByIds
  );
}
