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
import type { Item, UAVGroup, UAVIdAndMissionIndexPair } from './types';
import type { Nullable } from '~/utils/types';

// Helper functions related to sorting and filtering the UAVs list

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

function applyFiltersToUAVGroups(
  filters: UAVFilter[],
  groups: UAVGroup[],
  uavsByIds: Nullable<Record<string, StoredUAV>>
): UAVGroup[] {
  if (filters.length === 0) {
    return groups;
  }

  for (const filter of filters) {
    const func = getFilterFunctionForFilterIdentifier(filter)(uavsByIds!);
    groups = groups.map((group: UAVGroup) => ({
      ...group,
      items: group.items.filter(func),
    }));
  }

  return groups;
}

function applySortCriteriaToUAVGroups(
  sort: UAVSortKeyAndOrder,
  groups: UAVGroup[],
  uavsByIds: Nullable<Record<string, StoredUAV>>
): UAVGroup[] {
  const { key, reverse } = sort || {};
  if (uavsByIds) {
    // Use lodash to sort all items in each group
    const func = getSortFunctionForKey(key);
    return groups.map((group) => ({
      ...group,
      items: orderBy(
        group.items,
        [func(uavsByIds)],
        [reverse ? 'desc' : 'asc']
      ),
    }));
  } else {
    // No need to sort, but we may need to reverse the groups
    return reverse
      ? groups.map((group) => ({
          ...group,
          items: group.items.concat().reverse(),
        }))
      : groups;
  }
}

export function applyFiltersAndSortDisplayedUAVIdList(
  filters: UAVFilter[],
  sort: UAVSortKeyAndOrder,
  groups: UAVGroup[],
  uavsByIds: Nullable<Record<string, StoredUAV>>
): UAVGroup[] {
  const filteredGroups = applyFiltersToUAVGroups(filters, groups, uavsByIds);
  return applySortCriteriaToUAVGroups(sort, filteredGroups, uavsByIds);
}
