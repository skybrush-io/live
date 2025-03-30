import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import {
  getMissionMapping,
  getReverseMissionMapping,
  isMappingEditable,
} from '~/features/mission/selectors';
import {
  getUAVListFilters,
  getUAVListSortPreference,
  isShowingEmptyMissionSlots,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import {
  getUAVIdList,
  getUAVIdToStateMapping,
  getSelectedUAVIds,
} from '~/features/uavs/selectors';
import { UAVSortKey } from '~/model/sorting';

import { applyFiltersAndSortDisplayedUAVIdList } from './sorting';
import type { AppSelector, RootState } from '~/store/reducers';
import type { StoredUAV } from '~/features/uavs/types';
import type { Nullable } from '~/utils/types';
import {
  UAVGroupType,
  type GroupSelectionInfo,
  type Item,
  type UAVGroup,
} from './types';
import { flatten } from 'lodash-es';
import { itemToGlobalId } from './utils';

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when
 * we are using the mission-specific identifiers.
 *
 * The main section of the view will be sorted based on the mission-specific
 * indices. The "spare UAVs" section in the view will include all the UAVs
 * that are not currently assigned to the mission.
 *
 * The list returned from this selector is the "unprocessed" list, i.e. the
 * one before applying any filters or sorting criteria. See below for more
 * functions that perform the sorting and filtering.
 */
const getUnprocessedGroupsSortedByMissionId = createSelector(
  getMissionMapping,
  isMappingEditable,
  getUAVIdList,
  isShowingEmptyMissionSlots,
  (
    mapping: Array<Nullable<string>>,
    editable: boolean,
    uavIds: string[],
    showEmpty: boolean
  ): UAVGroup[] => {
    const mainUAVIds: Item[] = [];
    const spareUAVIds: Item[] = [];
    const result: UAVGroup[] = [];
    const seenUAVIds = new Set();

    for (const [index, uavId] of mapping.entries()) {
      if (isNil(uavId)) {
        // No UAV assigned to this slot
        if (showEmpty || editable) {
          mainUAVIds.push([undefined, index]);
        }
      } else {
        // Some UAV is assigned to this slot
        mainUAVIds.push([uavId, index]);
        seenUAVIds.add(uavId);
      }
    }

    for (const uavId of uavIds) {
      if (!seenUAVIds.has(uavId)) {
        // This UAV is not part of the current mapping.
        spareUAVIds.push([uavId, undefined]);
      }
    }

    result.push({
      id: 'assigned',
      type: UAVGroupType.ASSIGNED,
      items: mainUAVIds,
    });

    if (spareUAVIds.length > 0 || editable) {
      result.push({
        id: 'spare',
        type: UAVGroupType.SPARE,
        items: spareUAVIds,
      });
    }

    return result;
  }
);

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when we
 * are using the UAV IDs without their mission-specific identifiers.
 *
 * The list returned from this selector is the "unprocessed" list, i.e. the
 * one before applying any filters or sorting criteria. See below for more
 * functions that perform the sorting and filtering.
 */
const getUnprocessedGroupsSortedByUavId = createSelector(
  getUAVIdList,
  getReverseMissionMapping,
  (uavIds, reverseMapping): UAVGroup[] => [
    {
      id: 'all',
      type: UAVGroupType.ALL,
      items: uavIds.map((uavId) => [uavId, reverseMapping[uavId]]),
    },
  ]
);

const getUnprocessedGroupsBySections: AppSelector<UAVGroup[]> = (
  state: RootState
) =>
  isShowingMissionIds(state)
    ? getUnprocessedGroupsSortedByMissionId(state)
    : getUnprocessedGroupsSortedByUavId(state);

/**
 * Helper function for getDisplayedUAVGroups(); see an explanation there.
 */
const getUAVIdToStateMappingForSortAndFilter: AppSelector<
  Nullable<Record<string, StoredUAV>>
> = (state: RootState) => {
  const { key } = getUAVListSortPreference(state);
  const filters = getUAVListFilters(state);
  return key === UAVSortKey.DEFAULT && filters.length === 0
    ? null
    : getUAVIdToStateMapping(state);
};

/**
 * Selector that provides the list of UAV IDs to show in the UAV list, sorted
 * by sections.
 *
 * Note the weird helper selector: getUAVIdToStateMappingForSortAndFilter() returns the
 * UAV ID to state mapping only if it would be needed for the current sort option
 * or for the currently active filter(s), otherwise it returns null. This
 * prevents this selector from being invalidated if the UAVs change but the ID
 * list stays the same _when_ we are not sorting or filtering based on UAV
 * properties.
 */
export const getDisplayedGroups: AppSelector<UAVGroup[]> = createSelector(
  getUAVListFilters,
  getUAVListSortPreference,
  getUnprocessedGroupsBySections,
  getUAVIdToStateMappingForSortAndFilter,
  applyFiltersAndSortDisplayedUAVIdList
);

/**
 * Selector that returns the global IDs of all items (UAVs or mission slots)
 * that are currently shown in each of the groups, in the order they are shown.
 */
export const getGlobalIdsInDisplayedGroups = createSelector(
  getDisplayedGroups,
  (groups) =>
    groups.map(
      (group) =>
        group.items
          .map((item) => itemToGlobalId(item))
          .filter(Boolean) as string[]
    )
);

/**
 * Selector that returns _only_ the IDs of the UAVs that are currently shown
 * in each of the groups, in the order they are shown. Empty mission slots are
 * not included.
 */

export const getUAVIdsInDisplayedGroups = createSelector(
  getDisplayedGroups,
  (groups) =>
    groups.map((group) => {
      const result: string[] = [];
      for (const [uavId] of group.items) {
        if (!isNil(uavId)) {
          result.push(uavId);
        }
      }

      return result;
    })
);

/**
 * Selector that provides the global IDs of all UAVs and mission slots in the
 * UAV list, order they appear on the UI, but without sorting them into groups.
 */
export const getAllGlobalIdsInDisplayedGroups = createSelector(
  getGlobalIdsInDisplayedGroups,
  flatten
);

/**
 * Selector that provides the list of UAV IDs to show in the UAV list, in the
 * order they appear on the UI, but without sorting them into groups.
 */
export const getAllUAVIdsInDisplayedGroups = createSelector(
  getUAVIdsInDisplayedGroups,
  flatten
);

/**
 * Selector that takes the displayed list of UAV IDs sorted by sections,
 * and then returns an object mapping section identifiers to two booleans:
 * one that denotes whether _all_ the items are selected in the section, and
 * one that denotes whether _some_ but not all the items are selected in the
 * section. These are assigned to keys named `checked` and `indeterminate`,
 * respectively, so they can be used directly for an UAVListSubheader
 * component.
 */
export const getSelectionInfo = createSelector(
  getUAVIdsInDisplayedGroups,
  getSelectedUAVIds,
  (uavIdsByGroups, selectedIds) =>
    uavIdsByGroups.map((uavIds): GroupSelectionInfo => {
      const isSelected = (uavId: string): boolean =>
        selectedIds.includes(uavId);
      if (uavIds.length > 0) {
        // Check the first item; it will settle either someSelected
        // or allSelected
        if (isSelected(uavIds[0]!)) {
          const allIsSelected = uavIds.every(isSelected);
          return {
            checked: allIsSelected,
            indeterminate: !allIsSelected,
            disabled: false,
          };
        }

        const someIsSelected = uavIds.some(isSelected);
        return {
          checked: false,
          indeterminate: someIsSelected,
          disabled: false,
        };
      }

      return {
        checked: false,
        indeterminate: false,
        disabled: true,
      };
    })
);
