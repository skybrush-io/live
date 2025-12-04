import isNil from 'lodash-es/isNil';
import reject from 'lodash-es/reject';
import xor from 'lodash-es/xor';

import { setSelection } from '~/features/map/selection';
import flock from '~/flock';
import { isUavId, uavIdToGlobalId } from '~/model/identifiers';
import { getSelection } from '~/selectors/selection';

import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk } from '~/store/reducers';
import {
  getSelectedUAVIds,
  getUAVIdList,
  getUAVIdsMarkedAsGone,
} from './selectors';

/**
 * Action factory that returns a thunk that requests the global flock object
 * to remove the UAVs given by their IDs from the flock. The flock will in turn
 * dispatch events when the removal is done, and these events will in turn
 * update the store and remove the UAVs from there as well.
 */
export const requestRemovalOfUAVsByIds = (selection: string[]) => (): void => {
  if (selection.length > 0) {
    flock.removeUAVsByIds(selection);
  }
};

/**
 * Action factory that returns a thunk that removes the UAVs that are marked
 * as gone from the list of known UAVs.
 */
export const requestRemovalOfUAVsMarkedAsGone =
  (): AppThunk => (dispatch, getState) => {
    const selection = getUAVIdsMarkedAsGone(getState());
    if (selection.length > 0) {
      dispatch(requestRemovalOfUAVsByIds(selection));
    }
  };

/**
 * Action factory that returns a thunk that removes the selected UAVs from the
 * list of known UAVs.
 */
export const requestRemovalOfSelectedUAVs =
  (): AppThunk => (dispatch, getState) => {
    const selection = getSelectedUAVIds(getState()).filter(Boolean);
    if (selection.length > 0) {
      dispatch(requestRemovalOfUAVsByIds(selection));
    }
  };

/**
 * Action factory that creates an action that sets the set of selected
 * UAV IDs in the map.
 *
 * @param {Array.<string>} ids  the IDs of the selected UAVs. Any UAV
 *        whose ID is not in this set will be deselected, and so will be
 *        any feature that is not an UAV.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedUAVIds = (ids: string[]): PayloadAction<string[]> =>
  setSelection(
    (Array.isArray(ids) ? ids : [])
      .filter((id) => !isNil(id))
      .map((id) => uavIdToGlobalId(id))
  );

/**
 * Action factory that returns a thunk that toggles the selection of one or more
 * UAV IDs when dispatched.
 *
 * @param {Array.<string>} ids  the IDs of the UAVs to toggle.
 */
export const toggleUAVIdsInSelection =
  (ids: string[]): AppThunk =>
  (dispatch, getState) => {
    if (ids.length === 0) {
      return;
    }

    const selection = getSelectedUAVIds(getState());
    dispatch(setSelectedUAVIds(xor(selection, ids)));
  };

/**
 * Thunk that selects the single UAV in the flock if the user only has a single
 * UAV and does nothing otherwise.
 */
export const selectSingleUAVUnlessAmbiguous =
  (): AppThunk => (dispatch, getState) => {
    const state = getState();
    const uavIds = getUAVIdList(state);

    if (Array.isArray(uavIds) && uavIds.length === 1) {
      const otherSelection = reject(getSelection(state), isUavId);
      dispatch(setSelection([...otherSelection, uavIdToGlobalId(uavIds[0])]));
    }
  };
