import { createSelector } from '@reduxjs/toolkit';

import { getSelectedUAVIds } from '~/selectors/selection';

/**
 * Returns the current mapping from mission-specific slots to the corresponding
 * UAV identifiers.
 *
 * @param  {Object}  state  the state of the application
 */
export const getMissionMapping = state => state.mission.mapping;

/**
 * Returns whether the current mapping is editable at the moment.
 */
export const isMappingEditable = state => state.mission.mappingIsEditable;

/**
 * Returns whether the current selection has at least one drone that appears in
 * the mission mapping.
 */
export const selectionIntersectsMapping = createSelector(
  getMissionMapping,
  getSelectedUAVIds,
  (mapping, selectedUAVIds) => {
    for (const uavId of selectedUAVIds) {
      if (uavId !== undefined && mapping.includes(uavId)) {
        return true;
      }
    }

    return false;
  }
);
