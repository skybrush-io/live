import xor from 'lodash-es/xor';

import { setSelectedUAVIds } from '~/actions/map';
import flock from '~/flock';
import { getSelectedUAVIds } from '~/selectors/selection';

import { getUAVIdsMarkedAsGone } from './selectors';

/**
 * Action factory that returns a thunk that requests the global flock object
 * to remove the UAVs given by their IDs from the flock. The flock will in turn
 * dispatch events when the removal is done, and these events will in turn
 * update the store and remove the UAVs from there as well.
 */
export const requestRemovalOfUAVsByIds = (selection) => () => {
  if (selection.length > 0) {
    flock.removeUAVsByIds(selection);
  }
};

/**
 * Action factory that returns a thunk that removes the UAVs that are marked
 * as gone from the list of known UAVs.
 */
export const requestRemovalOfUAVsMarkedAsGone = () => (dispatch, getState) => {
  const selection = getUAVIdsMarkedAsGone(getState());
  if (selection.length > 0) {
    dispatch(requestRemovalOfUAVsByIds(selection));
  }
};

/**
 * Action factory that returns a thunk that removes the selected UAVs from the
 * list of known UAVs.
 */
export const requestRemovalOfSelectedUAVs = () => (dispatch, getState) => {
  const selection = getSelectedUAVIds(getState()).filter(Boolean);
  if (selection.length > 0) {
    dispatch(requestRemovalOfUAVsByIds(selection));
  }
};

/**
 * Action factory that returns a thunk that toggles the selection of one or more
 * UAV IDs when dispatched.
 *
 * @param {Array.<string>} ids  the IDs of the UAVs to toggle.
 */
export const toggleUAVIdsInSelection = (ids) => (dispatch, getState) => {
  if (ids.length === 0) {
    return;
  }

  const selection = getSelectedUAVIds(getState());
  dispatch(setSelectedUAVIds(xor(selection, ids)));
};
