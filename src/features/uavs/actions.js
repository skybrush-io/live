import xor from 'lodash-es/xor';

import { setSelectedUAVIds } from '~/actions/map';
import { getSelectedUAVIds } from '~/selectors/selection';

/**
 * Action factory that returns a thunk that toggles the selection of one or more
 * UAV IDs when dispatched.
 *
 * @param {Array.<string>} ids  the IDs of the UAVs to toggle.
 */
export const toggleUAVIdsInSelection = (ids) => (dispatch, getState) => {
  const selection = getSelectedUAVIds(getState());
  dispatch(setSelectedUAVIds(xor(selection, ids)));
};
