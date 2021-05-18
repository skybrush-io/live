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
import { isShowingMissionIds } from '~/features/settings/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import { getSelectedUAVIds } from '~/selectors/selection';

/**
 * Special marker that we can place into the list items returned from
 * getDisplayedIdList() to produce a slot where deleted UAVs can be dragged.
 */
export const deletionMarker = [undefined, undefined, <Delete key='__delete' />];

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when
 * we are using the mission-specific identifiers.
 *
 * The main section of the view will be sorted based on the mission-specific
 * indices. The "spare UAVs" section in the view will include all the UAVs
 * that are not currently assigned to the mission.
 */
const getDisplayListSortedByMissionId = createSelector(
  getMissionMapping,
  isMappingEditable,
  getUAVIdList,
  (mapping, editable, uavIds) => {
    const mainUAVIds = [];
    const spareUAVIds = [];
    const extraSlots = [];
    const seenUAVIds = new Set();

    for (const [index, uavId] of mapping.entries()) {
      if (isNil(uavId)) {
        // No UAV assigned to this slot
        mainUAVIds.push([undefined, index]);
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
 */
const getDisplayListSortedByUavId = createSelector(
  getUAVIdList,
  getReverseMissionMapping,
  (uavIds, reverseMapping) => ({
    mainUAVIds: uavIds.map((uavId) => [uavId, reverseMapping[uavId]]),
    spareUAVIds: [],
    extraSlots: [],
  })
);

/**
 * Selector that provides the list of UAV IDs to show in the UAV list.
 */
export const getDisplayedIdList = (state) =>
  isShowingMissionIds(state)
    ? getDisplayListSortedByMissionId(state)
    : getDisplayListSortedByUavId(state);

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
  getDisplayedIdList,
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
