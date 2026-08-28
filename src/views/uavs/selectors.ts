import { createSelector } from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';

import {
  getMissionMapping,
  isMappingEditable,
} from '~/features/mission/selectors';
import {
  getUAVListFilters,
  getUAVListSortPreference,
  isShowingEmptyMissionSlots,
} from '~/features/settings/selectors';
import type { UAVSortKeyAndOrder } from '~/features/settings/types';
import {
  getUAVIdList,
  getUAVIdToStateMapping,
} from '~/features/uavs/selectors';
import type { StoredUAV } from '~/features/uavs/types';
import { UAVSortKey } from '~/model/sorting';
import type { AppSelector, RootState } from '~/store/reducers';
import type { Nullable } from '~/utils/types';

import { applyFiltersAndSortDisplayedUAVIdList } from './sorting';
import type { Item } from './types';
import { itemToGlobalId } from './utils';

/**
 * Helper function for getDisplayedItems() and getDisplayedGroups().
 *
 * This function returns a mapping from UAV IDs to the corresponding stored
 * UAV objects _if_ this information is required to perform the sorting or
 * filtering that the user requested. When the user requested no sorting or
 * filtering, this function returns null. This prevents selectors depending
 * on this function from being invalidated when the state of the UAVs change but
 * the downstream selector does not need this information.
 */
const getUAVIdToStateMappingForSortAndFilter: AppSelector<
  Nullable<Record<string, StoredUAV>>
> = (state: RootState) => {
  const { key } = getEffectiveUAVListSortOrder(state);
  const filters = getUAVListFilters(state);
  // UAV ID / mission index based sorts don't need the StoredUAV mapping,
  // they can be computed from the item tuple directly.
  const sortNeedsStateMapping =
    key !== UAVSortKey.UAV_ID && key !== UAVSortKey.MISSION_ID;
  return !sortNeedsStateMapping && filters.length === 0
    ? null
    : getUAVIdToStateMapping(state);
};

/* ************************************************************************* */
/* Selectors for ungrouped, virtualized UAV lists                            */
/* ************************************************************************* */

/**
 * Unprocessed UAV list: mission slots (with optional empty placeholders),
 * then spare UAVs not assigned to any slot. Filters and sort preferences are
 * applied downstream.
 */
const getUnprocessedItems = createSelector(
  getMissionMapping,
  isMappingEditable,
  getUAVIdList,
  isShowingEmptyMissionSlots,
  (
    mapping: Array<Nullable<string>>,
    editable: boolean,
    uavIds: string[],
    showEmpty: boolean
  ): Item[] => {
    const result: Item[] = [];
    const seenUAVIds = new Set();

    for (const [index, uavId] of mapping.entries()) {
      if (isNil(uavId)) {
        // No UAV assigned to this slot
        if (showEmpty || editable) {
          result.push([undefined, index]);
        }
      } else {
        // Some UAV is assigned to this slot
        result.push([uavId, index]);
        seenUAVIds.add(uavId);
      }
    }

    for (const uavId of uavIds) {
      if (!seenUAVIds.has(uavId)) {
        // This UAV is not part of the current mapping.
        result.push([uavId, undefined]);
      }
    }

    return result;
  }
);

const SORT_BY_MISSION_ID: UAVSortKeyAndOrder = Object.freeze({
  key: UAVSortKey.MISSION_ID,
  reverse: false,
});

/**
 * Returns the _effective_ sort order of the list showing the UAVs, taking into account
 * any overrides from the UI state.
 *
 * We always sort by sID when the user is editing the mapping, regardless of the sort
 * order preference in the settings. This is because it would be really hard to keep
 * the item being edited in the view when the list is constantly re-sorted by other
 * criteria.
 */
export const getEffectiveUAVListSortOrder = createSelector(
  getUAVListSortPreference,
  isMappingEditable,
  (sortPreference, isEditingMapping): UAVSortKeyAndOrder => {
    return isEditingMapping ? SORT_BY_MISSION_ID : sortPreference;
  }
);

/**
 * Selector that provides the list of UAV IDs and mission slots to show in the
 * UAV list, after applying the sorting and filtering criteria that the user
 * requested.
 */
export const getDisplayedItems: AppSelector<Item[]> = createSelector(
  getUAVListFilters,
  getEffectiveUAVListSortOrder,
  getUnprocessedItems,
  getUAVIdToStateMappingForSortAndFilter,
  applyFiltersAndSortDisplayedUAVIdList
);

/**
 * Selector that provides the global IDs of all UAVs and mission slots in the
 * UAV list, order they appear on the UI, but without sorting them into groups.
 */
export const getGlobalIdsOfDisplayedItems = createSelector(
  getDisplayedItems,
  (items) => items.map(itemToGlobalId).filter(Boolean) as string[]
);
