import isNil from 'lodash-es/isNil';

import type { MissionIndex } from '~/model/missions';
import type { AppThunk } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import type { Nullable } from '~/utils/types';

import {
  getIndexOfMappingSlotBeingEdited,
  getMissionMapping,
} from '../selectors';
import {
  _setMapping,
  _setMappingLength,
  notifyUAVsInMissionMappingChanged,
  updateEditedMappingIndex,
} from '../slice';
import { type MissionMappingEditorContinuation } from '../utils';

export const adjustMissionMapping =
  ({ uavId, to }: { uavId: Identifier; to: MissionIndex | null }): AppThunk =>
  (dispatch, getState) => {
    const affectedUavIds: Identifier[] = [uavId];
    const mapping = [...getMissionMapping(getState())];
    const from = mapping.indexOf(uavId);
    const uavIdToReplace = isNil(to) ? null : mapping[to];

    if (!isNil(uavIdToReplace)) {
      affectedUavIds.push(uavIdToReplace);
    }

    if (from >= 0) {
      mapping[from] = uavIdToReplace ?? null;
    }

    if (!isNil(to)) {
      mapping[to] = uavId;
    }

    dispatch(_setMapping(mapping));
    dispatch(notifyUAVsInMissionMappingChanged(affectedUavIds));
  };

/**
 * Clears the entire mission mapping.
 */
export const clearMapping = (): AppThunk => (dispatch, getState) => {
  const length = getMissionMapping(getState()).length;
  dispatch(_setMapping(Array.from({ length }, () => null)));
  // The entire mapping is invalid.
  dispatch(notifyUAVsInMissionMappingChanged(undefined));
};

/**
 * Commits the new value in the mapping editor to the current slot being
 * edited, and optionally continues with the next slot.
 */
export const commitMappingEditorSessionAtCurrentSlot =
  ({
    continuation,
    value,
  }: {
    continuation: MissionMappingEditorContinuation;
    value: string;
  }): AppThunk =>
  (dispatch, getState) => {
    const validatedValue =
      typeof value === 'string' && value.trim().length > 0 ? value : null;
    const state = getState();
    const mappingState = getMissionMapping(state);
    const index = getIndexOfMappingSlotBeingEdited(state);

    if (index >= 0 && index < mappingState.length) {
      const newMapping = [...mappingState];
      const oldValue = newMapping[index];
      const existingIndex =
        validatedValue === null ? -1 : newMapping.indexOf(validatedValue);

      // Collect affected UAV IDs (non-null values)
      const affectedUavIds: Identifier[] = [];
      if (!isNil(oldValue)) {
        affectedUavIds.push(oldValue);
      }
      if (!isNil(validatedValue)) {
        affectedUavIds.push(validatedValue);
      }

      // Prevent duplicates: if the value being entered already exists
      // elsewhere in the mapping, swap it with the old value of the
      // slot being edited.
      if (existingIndex >= 0) {
        newMapping[existingIndex] = oldValue ?? null;
      }

      newMapping[index] = validatedValue;
      dispatch(_setMapping(newMapping));
      if (affectedUavIds.length > 0) {
        dispatch(notifyUAVsInMissionMappingChanged(affectedUavIds));
      }
    }

    dispatch(updateEditedMappingIndex(continuation));
  };

/**
 * Removes some UAVs from the mission mapping.
 */
export const removeUAVsFromMapping =
  (uavIds: Identifier[]): AppThunk =>
  (dispatch, getState) => {
    const mapping = [...getMissionMapping(getState())];
    const affectedUavIds: Identifier[] = [];

    for (const uavId of uavIds) {
      const index = mapping.indexOf(uavId);
      if (index >= 0) {
        affectedUavIds.push(uavId);
        mapping[index] = null;
      }
    }

    dispatch(_setMapping(mapping));
    if (affectedUavIds.length > 0) {
      dispatch(notifyUAVsInMissionMappingChanged(affectedUavIds));
    }
  };

/**
 * Replaces the entire mission mapping with a new one.
 */
export const replaceMapping =
  (newMapping: Array<Nullable<Identifier>>): AppThunk =>
  (dispatch, getState) => {
    if (!Array.isArray(newMapping)) {
      throw new TypeError('New mapping must be an array');
    }

    const currentMapping = getMissionMapping(getState());
    const currentLength = currentMapping.length;
    if (newMapping.length !== currentLength) {
      throw new Error('Cannot change mapping length with replaceMapping()');
    }

    // Collect affected UAV IDs (non-null values from both current and new mapping)
    const affectedUavIds: Identifier[] = [
      ...currentMapping.filter((id): id is Identifier => !isNil(id)),
      ...newMapping.filter((id): id is Identifier => !isNil(id)),
    ];

    dispatch(_setMapping(newMapping));
    if (affectedUavIds.length > 0) {
      dispatch(notifyUAVsInMissionMappingChanged(affectedUavIds));
    }
  };

/**
 * Sets the length of the mapping. When the new length is smaller than the
 * old length, the mapping will be truncated from the end. When the new
 * length is larger than the old length, empty slots will be added to the
 * end of the mapping.
 */
export const setMappingLength =
  (length: string | number): AppThunk =>
  (dispatch, getState) => {
    const currentMapping = getMissionMapping(getState());
    const desiredLength =
      typeof length === 'string' ? Number.parseInt(length, 10) : length;

    let affectedUavIds: Identifier[] | undefined;
    if (
      !Number.isNaN(desiredLength) &&
      desiredLength >= 0 &&
      desiredLength < currentMapping.length
    ) {
      // Collect affected UAV IDs (non-null values in truncated range)
      affectedUavIds = currentMapping
        .slice(desiredLength)
        .filter((id): id is Identifier => !isNil(id));
    }

    dispatch(_setMappingLength(length));

    if (affectedUavIds !== undefined && affectedUavIds.length > 0) {
      dispatch(notifyUAVsInMissionMappingChanged(affectedUavIds));
    }
  };
