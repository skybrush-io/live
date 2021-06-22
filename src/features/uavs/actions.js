import xor from 'lodash-es/xor';

import { setSelectedUAVIds } from '~/actions/map';
import { getSelectedUAVIds } from '~/selectors/selection';

import { getUAVIdsMarkedAsGone } from './selectors';
import { removeUAVsByIds } from './slice';

/**
 * Action factory that returns a thunk that removes the UAVs that are marked
 * as gone from the list of known UAVs.
 */
export const removeUAVsMarkedAsGone = () => (dispatch, getState) => {
  const selection = getUAVIdsMarkedAsGone(getState());
  if (selection.length > 0) {
    dispatch(removeUAVsByIds(selection));
  }
};

/**
 * Action factory that returns a thunk that removes the selected UAVs from the
 * list of known UAVs.
 */
export const removeSelectedUAVs = () => (dispatch, getState) => {
  const selection = getSelectedUAVIds(getState()).filter(Boolean);
  if (selection.length > 0) {
    dispatch(removeUAVsByIds(selection));
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
