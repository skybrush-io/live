import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import React from 'react';
import { createSelector } from '@reduxjs/toolkit';
import Delete from '@material-ui/icons/Delete';

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

/**
 * Special marker that we can place into the list items returned from
 * getDisplayedIdListBySections() to produce a slot where deleted UAVs can be dragged.
 */
export const deletionMarker = [undefined, undefined, <Delete key='__delete' />];

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
const getUnprocessedDisplayedIdListSortedByMissionId = createSelector(
  getMissionMapping,
  isMappingEditable,
  getUAVIdList,
  isShowingEmptyMissionSlots,
  (mapping, editable, uavIds, showEmpty) => {
    const mainUAVIds = [];
    const spareUAVIds = [];
    const extraSlots = [];
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

    // If we are in editing mode, we always add one extra slot where the user
    // can drag UAVs that should be deleted
    if (editable) {
      extraSlots.push(deletionMarker);
    }

    return { mainUAVIds, spareUAVIds, extraSlots };
  }
);

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when we
 * are using the UAV IDs without their mission-specific identifiers.
 *
 * The main section of the view will be sorted based on the UAV IDs in the
 * state store. The "spare UAVs" section in the view will be empty.
 *
 * The list returned from this selector is the "unprocessed" list, i.e. the
 * one before applying any filters or sorting criteria. See below for more
 * functions that perform the sorting and filtering.
 */
const getUnprocessedDisplayedIdListSortedByUavId = createSelector(
  getUAVIdList,
  getReverseMissionMapping,
  (uavIds, reverseMapping) => ({
    mainUAVIds: uavIds.map((uavId) => [uavId, reverseMapping[uavId]]),
    spareUAVIds: [],
    extraSlots: [],
  })
);

const getUnprocessedDisplayedIdListBySections = (state) =>
  isShowingMissionIds(state)
    ? getUnprocessedDisplayedIdListSortedByMissionId(state)
    : getUnprocessedDisplayedIdListSortedByUavId(state);

/**
 * Helper function for getDisplayedIdListBySections(); see an explanation there.
 */
const getUAVIdToStateMappingForSortAndFilter = (state) => {
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
export const getDisplayedIdListBySections = createSelector(
  getUAVListFilters,
  getUAVListSortPreference,
  getUnprocessedDisplayedIdListBySections,
  getUAVIdToStateMappingForSortAndFilter,
  applyFiltersAndSortDisplayedUAVIdList
);

/**
 * Selector that provides the list of UAV IDs to show in the UAV list, in the
 * order they appear on the UI, but without sorting them into sections.
 */
export const getDisplayedIdList = createSelector(
  getDisplayedIdListBySections,
  ({ mainUAVIds, spareUAVIds }) => {
    const result = [];

    for (const item of mainUAVIds) {
      if (!isNil(item[0])) {
        result.push(item[0]);
      }
    }

    for (const item of spareUAVIds) {
      result.push(item[0]);
    }

    return result;
  }
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
  getDisplayedIdListBySections,
  getSelectedUAVIds,
  (displayedIdList, selectedIds) =>
    mapValues(displayedIdList, (idsAndLabels) => {
      const nonEmptyIdsAndLabels = idsAndLabels.filter(
        (idAndLabel) => !isNil(idAndLabel[0])
      );
      const itemIsSelected = (idAndLabel) =>
        selectedIds.includes(idAndLabel[0]);
      if (nonEmptyIdsAndLabels.length > 0) {
        // Check the first item in idsAndLabels; it will settle either someSelected
        // or allSelected
        if (itemIsSelected(nonEmptyIdsAndLabels[0])) {
          const allIsSelected = nonEmptyIdsAndLabels.every(itemIsSelected);
          return {
            checked: allIsSelected,
            indeterminate: !allIsSelected,
          };
        }

        const someIsSelected = nonEmptyIdsAndLabels.some(itemIsSelected);
        return {
          checked: false,
          indeterminate: someIsSelected,
        };
      }

      return {
        checked: false,
        indeterminate: false,
        disabled: true,
      };
    })
);
