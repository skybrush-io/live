import { clearSelection } from '~/actions/map';
import { showNotification } from '~/features/snackbar/slice';
import { copyDisplayedCoordinatesToClipboard } from '~/views/map/utils';

import { getPendingUAVId, isPendingUAVIdOverlayVisible } from './selectors';
import { setPendingUAVId, startPendingUAVIdTimeout } from './slice';

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
