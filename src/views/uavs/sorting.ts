import identity from 'lodash-es/identity';
import mapValues from 'lodash-es/mapValues';
import memoize from 'memoizee';
import { orderBy } from 'natural-orderby';
import type { UAVSortKeyAndOrder } from '~/features/settings/types';
import type { StoredUAV } from '~/features/uavs/types';

import {
  getFilterFunctionForUAVFilter,
  type UAVFilter,
} from '~/model/filtering';
import {
  getKeyFunctionForUAVSortKey,
  type Comparable,
  type UAVSortKey,
} from '~/model/sorting';
import type { GroupedUAVIds, Item, UAVIdAndMissionIndexPair } from './types';
import type { Nullable } from '~/utils/types';

// Helper functions related to sorting and filtering the UAVs list

function reversedValues<T>(object: Record<string, T[]>): Record<string, T[]> {
  return mapValues(object, (array) => array.concat().reverse());
}

function alwaysTrue(): boolean {
  return true;
}

/**
 * Returns an array filtering functon factory given a filter identifier. The
 * returned function must be called with a UAV-ID-to-state mapping and it will
 * return another function that can be used to filter an array of UAV IDs based
 * on the given filter.
 */
const getFilterFunctionForFilterIdentifier = memoize((filterId: UAVFilter) => {
  const filter = getFilterFunctionForUAVFilter(filterId);
  return filter
    ? (uavsByIds: Record<string, StoredUAV>) =>
        (uavIdAndMissionId: UAVIdAndMissionIndexPair | Item): boolean =>
          filter(uavsByIds[uavIdAndMissionId[0]!])
    : // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      () => alwaysTrue;
});

/**
 * Returns a Lodash sorting function factory given a sort key. The returned
 * function must be called with a UAV-ID-to-state mapping and it will return
 * another function that can be used to sort an array of UAV IDs based on
 * the given sorting key.
 */
const getSortFunctionForKey = memoize((key: UAVSortKey) => {
  const getter = getKeyFunctionForUAVSortKey(key);
  return getter
    ? (uavsByIds: Record<string, StoredUAV>) =>
        (uavIdAndMissionId: UAVIdAndMissionIndexPair | Item): Comparable =>
          getter(uavsByIds[uavIdAndMissionId[0]!])
    : // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      () => identity;
});

function applyFiltersToUAVIdsBySections(
  filters: UAVFilter[],
  uavIdsBySections: GroupedUAVIds,
  uavsByIds: Nullable<Record<string, StoredUAV>>
): GroupedUAVIds {
  if (filters.length === 0) {
    return uavIdsBySections;
  }

  for (const filter of filters) {
    const func = getFilterFunctionForFilterIdentifier(filter)(uavsByIds!);
    uavIdsBySections = mapValues(
      uavIdsBySections,
      (uavIds: UAVIdAndMissionIndexPair[] | Item[]) => uavIds.filter(func)
    ) as any as GroupedUAVIds;
  }

  return uavIdsBySections;
}

function applySortCriteriaToUAVIdsBySections(
  sort: UAVSortKeyAndOrder,
  uavIdsBySections: GroupedUAVIds,
  uavsByIds: Nullable<Record<string, StoredUAV>>
): GroupedUAVIds {
  const { key, reverse } = sort || {};
  if (uavsByIds) {
    // Use lodash to sort all values in uavIdsBySections
    const func = getSortFunctionForKey(key);
    return mapValues(uavIdsBySections, (uavIds) => {
      return orderBy(uavIds, [func(uavsByIds)], [reverse ? 'desc' : 'asc']);
    }) as any as GroupedUAVIds;
  } else {
    // No need to sort, but we may need to reverse the arrays
    return reverse
      ? (reversedValues<any>(uavIdsBySections) as any as GroupedUAVIds)
      : uavIdsBySections;
  }
}

export function applyFiltersAndSortDisplayedUAVIdList(
  filters: UAVFilter[],
  sort: UAVSortKeyAndOrder,
  uavIdsBySections: GroupedUAVIds,
  uavsByIds: Nullable<Record<string, StoredUAV>>
): GroupedUAVIds {
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
