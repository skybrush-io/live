import isNil from 'lodash-es/isNil';

import { clearSelection, setSelectedUAVIds } from '~/actions/map';
import { getMissionMapping } from '~/features/mission/selectors';
import { showNotification } from '~/features/snackbar/slice';
import { getUAVById } from '~/features/uavs/selectors';
import { scrollUAVListItemIntoView } from '~/utils/navigation';
import { copyDisplayedCoordinatesToClipboard } from '~/views/map/utils';

import { getPendingUAVId, isPendingUAVIdOverlayVisible } from './selectors';
import { sendKeyboardNavigationSignal } from './signal';
import { setPendingUAVId, startPendingUAVIdTimeout } from './slice';

/* Prefixes to try in front of a UAV ID in case the "real" UAV ID has leading
 * zeros */
const LEADING_ZEROS = ['', '0', '00', '000', '0000'];

function handleAndClearPendingUAVId(dispatch, getState) {
  const state = getState();
  const pendingUAVId = getPendingUAVId(state);

  if (
    pendingUAVId &&
    typeof pendingUAVId === 'string' &&
    pendingUAVId.length > 0
  ) {
    const newSelection = [];
    const mapping = getMissionMapping(state);

    if (pendingUAVId.charAt(0) === 's') {
      const index = Number(pendingUAVId.slice(1));
      if (Number.isFinite(index)) {
        const uavId = mapping[index - 1];
        if (!isNil(uavId)) {
          newSelection.push(uavId);
        }
      }
    } else {
      const allNumeric = /^\d+$/.test(pendingUAVId);
      const prefixes = allNumeric ? LEADING_ZEROS : [''];
      for (const prefix of prefixes) {
        const uavId = prefix + pendingUAVId;
        const uav = getUAVById(state, uavId);

        /* we consider the UAV ID as found if we either have a UAV with status
         * information that corresponds to this ID, or if the UAV ID is in the
         * mission mapping */
        if (uav || mapping.includes(uavId)) {
          newSelection.push(uavId);
          break;
        }
      }
    }

    dispatch(setSelectedUAVIds(newSelection));
    dispatch(clearPendingUAVId());

    if (newSelection.length > 0) {
      scrollUAVListItemIntoView(newSelection[0]);
    }

    /* selection was handled, caller might want to skip its own default action */
    return true;
  }

  /* nothing was selected, caller can proceed with its own default action */
  return false;
}

export function activateSelection() {
  return (dispatch, getState) => {
    if (!handleAndClearPendingUAVId(dispatch, getState)) {
      sendKeyboardNavigationSignal('ACTIVATE_SELECTION')();
    }
  };
}

/**
 * Appends a new character to the end of the pending UAV ID string that allows
 * the user to select a UAV simply by typing.
 */
export function appendToPendingUAVId(char) {
  return (dispatch, getState) => {
    /* 's' is allowed at the beginning when the UAV ID is empty. Otherwise we
     * allow 0-9 only */
    if (char === 's') {
      dispatch(setPendingUAVId('s'));
      return;
    }

    if (typeof char === 'number') {
      char = String(char);
    }

    if (
      typeof char === 'string' &&
      char.length === 1 &&
      char >= '0' &&
      char <= '9'
    ) {
      const pendingUAVId = getPendingUAVId(getState());

      /* impose a length limit */
      if (pendingUAVId.length < 10) {
        dispatch(setPendingUAVId(pendingUAVId + char));
      }

      dispatch(startPendingUAVIdTimeout());
    }
  };
}

/**
 * Clears the pending UAV ID and dismisses the overlay that shows it.
 */
export function clearPendingUAVId() {
  return setPendingUAVId('');
}

export function clearSelectionOrPendingUAVId() {
  return (dispatch, getState) => {
    const hasPendingUAVId = isPendingUAVIdOverlayVisible(getState());
    if (hasPendingUAVId) {
      dispatch(clearPendingUAVId());
    } else {
      dispatch(clearSelection());
    }
  };
}

/**
 * Thunk action that copies the currently displayed map coordinates to the
 * clipboard and then shows a notification to the user.
 */
export const copyCoordinates = () => (dispatch) => {
  if (copyDisplayedCoordinatesToClipboard()) {
    dispatch(showNotification('Coordinates copied to clipboard.'));
  } else {
    dispatch(
      showNotification({
        message: 'Failed to copy coordinates; are you hovering over the map?',
        semantics: 'error',
      })
    );
  }
};

/**
 * Deletes the last character of the pending UAV ID.
 */
export function deleteLastCharacterOfPendingUAVId() {
  return (dispatch, getState) => {
    const pendingUAVId = getPendingUAVId(getState());
    if (pendingUAVId.length > 0) {
      dispatch(setPendingUAVId(pendingUAVId.slice(0, -1)));
      dispatch(startPendingUAVIdTimeout());
    }
  };
}
