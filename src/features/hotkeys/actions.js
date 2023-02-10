import isNil from 'lodash-es/isNil';

import { dismissAlerts } from '~/features/alert/slice';
import { hasPendingAudibleAlerts } from '~/features/alert/selectors';
import { clearSelection } from '~/features/map/selection';
import { getMissionMapping } from '~/features/mission/selectors';
import { showNotification } from '~/features/snackbar/slice';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import { getUAVById } from '~/features/uavs/selectors';
import { scrollUAVListItemIntoView } from '~/utils/navigation';
import { copyDisplayedCoordinatesToClipboard } from '~/views/map/utils';

import { getPendingUAVId, isPendingUAVIdOverlayVisible } from './selectors';
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

/**
 * Helper function that takes an arbitrary function and returns a Redux action
 * factory that creates an action that will 1) first check whether the user has
 * a pending UAV ID typed in via the keyboard, and if so, selects the UAV, and
 * then 2) calls the given function with its original arguments
 *
 * @param {function}  func  the function to call
 * @param {bool} executeOnlyWithoutPendingUAVId  whether the function must be
 *        called _only_ if there was no pending UAV
 */
export function handlePendingUAVIdThenCall(
  func,
  { executeOnlyWithoutPendingUAVId } = {}
) {
  return (...args) =>
    (dispatch, getState) => {
      const hadPendingUAVId = handleAndClearPendingUAVId(dispatch, getState);
      if (!hadPendingUAVId || !executeOnlyWithoutPendingUAVId) {
        return func(...args);
      }
    };
}

/**
 * Helper function that takes a Redux action factory and returns another action
 * factory that creates an action that will 1) first check whether the user has
 * a pending UAV ID typed in via the keyboard, and if so, selects the UAV, and
 * then 2) dispatches the action returned by the original factory with its
 * original arguments
 *
 * @param {function}  actionFactory  the action factory to wrap
 * @param {bool} executeOnlyWithoutPendingUAVId  whether the function must be
 *        called _only_ if there was no pending UAV
 */
export function handlePendingUAVIdThenDispatch(
  actionFactory,
  { executeOnlyWithoutPendingUAVId } = {}
) {
  return (...args) =>
    (dispatch, getState) => {
      const hadPendingUAVId = handleAndClearPendingUAVId(dispatch, getState);
      if (!hadPendingUAVId || !executeOnlyWithoutPendingUAVId) {
        const action = actionFactory(...args);
        return dispatch(action);
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
      dispatch(startPendingUAVIdTimeout());
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

/**
 * Action factory that is bound to the Esc key; clears the pending UAV ID
 * overlay if it is visible; otherwise it dismisses the current audible alert
 * if there are any and the alerts are audible; otherwise it clears the
 * selection.
 */
export function clearSelectionOrPendingUAVId() {
  return (dispatch, getState) => {
    const state = getState();
    if (isPendingUAVIdOverlayVisible(state)) {
      dispatch(clearPendingUAVId());
    } else if (hasPendingAudibleAlerts(state)) {
      dispatch(dismissAlerts());
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
