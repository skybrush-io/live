import type { Action } from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';

import { copyDisplayedCoordinatesToClipboard } from '~/components/map/utils';
import { hasPendingAudibleAlerts } from '~/features/alert/selectors';
import { dismissAlerts } from '~/features/alert/slice';
import {
  getMissionMapping,
  isMappingEditable,
} from '~/features/mission/selectors';
import { finishMappingEditorSession } from '~/features/mission/slice';
import { clearSelection, selectGroup } from '~/features/selection/slice';
import { showError, showNotification } from '~/features/snackbar/actions';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import { getUAVById } from '~/features/uavs/selectors';
import type { AppDispatch, AppThunk, RootState } from '~/store/reducers';
import { scrollUAVListItemIntoView } from '~/utils/navigation';

import type { Nullable } from '~/utils/types';
import { getPendingUAVId, isPendingUAVIdOverlayVisible } from './selectors';
import { setPendingUAVId, startPendingUAVIdTimeout } from './slice';

/* Prefixes to try in front of a UAV ID in case the "real" UAV ID has leading
 * zeros */
const LEADING_ZEROS = ['', '0', '00', '000', '0000'];

/**
 * Generator that resolves the string description of a range declaration
 * (inclusive on both ends) into an sequence of *string* identifiers.
 *
 * @param desc The string description of the range.
 * @yields The identifiers of all items in the range.
 */
function* resolveRange(desc: string, rangeSeparator = '-'): Generator<string> {
  const split = desc.split(rangeSeparator);
  if (split.length > 2) {
    return; // Invalid input, return an empty array.
  }

  const [startStr, endStr] = split.length == 2 ? split : [split[0], split[0]];
  const start = Number.parseInt(startStr);
  const end = Number.parseInt(endStr);
  if (!(Number.isFinite(start) && Number.isFinite(end) && start <= end)) {
    return; // Invalid range, return an empty array.
  }

  for (let i = start; i <= end; i++) {
    yield i.toString();
  }
}

/**
 * Resolves the given show index to a selection index.
 *
 * @param value The ID to resolve.
 * @param missionMapping Mapping from mission-specific slots to the
 *   corresponding UAV identifiers.
 * @returns The resolved ID or `undefined` if the ID could not be resolved.
 */
function showIndexToSelectionIndex(
  value: string,
  missionMapping: Array<Nullable<string>>,
  _state?: RootState
): string | undefined {
  const index = Number.parseInt(value);
  if (!Number.isFinite(index)) {
    return undefined;
  }

  const uavId = missionMapping[index - 1];
  return isNil(uavId) ? undefined : uavId;
}

/**
 * Resolves the given drone ID to a selection index.
 *
 * @param value The ID to resolve.
 * @param missionMapping Mapping from mission-specific slots to the
 *   corresponding UAV identifiers.
 * @param state The root redux state.
 *
 * @returns The resolved ID or `undefined` if the ID could not be resolved.
 */
function droneIdsToSelectionIndex(
  value: string,
  missionMapping: Array<Nullable<string>>,
  state: RootState
): string | undefined {
  const allNumeric = /^\d+$/.test(value);
  const prefixes = allNumeric ? LEADING_ZEROS : [''];
  for (const prefix of prefixes) {
    const uavId = prefix + value;
    const uav = getUAVById(state, uavId);

    /* we consider the UAV ID as found if we either have a UAV with status
     * information that corresponds to this ID, or if the UAV ID is in the
     * mission mapping */
    if (uav || missionMapping.includes(uavId)) {
      return uavId;
    }
  }
}

function getPendingUAVIdMode(pendingUAVId: string) {
  return pendingUAVId.startsWith('g') ? 'group' : 'uav';
}

function handleAndClearPendingUAVId(
  dispatch: AppDispatch,
  getState: () => RootState
): boolean {
  const state = getState();
  let pendingUAVId = getPendingUAVId(state);

  if (
    !(
      pendingUAVId &&
      typeof pendingUAVId === 'string' &&
      pendingUAVId.length > 0
    )
  ) {
    // nothing was selected, caller can proceed with its own default action
    return false;
  }

  const mode = getPendingUAVIdMode(pendingUAVId);
  if (mode === 'group') {
    // Shortcut that updates the selection without ID conversions.
    dispatch(selectGroup(pendingUAVId.slice(1)));
    dispatch(clearPendingUAVId());
    return true;
  } else if (mode !== 'uav') {
    // Only the group and uav modes are supported
    return false;
  }

  const mapping = getMissionMapping(state);

  const newSelection = [];
  // Function that expects a single string identifier, the mission mapping, and the root redux state.
  let resolveUAVId: (
    key: string,
    mapping: Array<Nullable<string>>,
    state: RootState
  ) => string | undefined;
  if (pendingUAVId.charAt(0) === 's') {
    resolveUAVId = showIndexToSelectionIndex;
    pendingUAVId = pendingUAVId.slice(1); // Remove the s prefix, keep the pure ID.
  } else {
    resolveUAVId = droneIdsToSelectionIndex;
  }

  for (const key of resolveRange(pendingUAVId, '-')) {
    const uavId = resolveUAVId(key, mapping, state);
    if (uavId !== undefined) {
      newSelection.push(uavId);
    }
  }

  dispatch(setSelectedUAVIds(newSelection));
  dispatch(clearPendingUAVId());

  if (newSelection.length > 0) {
    scrollUAVListItemIntoView(newSelection[0]);
  }

  // selection was handled, caller might want to skip its own default action
  return true;
}

/**
 * Helper function that takes an arbitrary function and returns a Redux action
 * factory that creates an action that will 1) first check whether the user has
 * a pending UAV ID typed in via the keyboard, and if so, selects the UAV, and
 * then 2) calls the given function with its original arguments
 *
 * @param func The function to call.
 * @param executeOnlyWithoutPendingUAVId Whether the function must be called
 *   only if there was no pending UAV.
 */
export function handlePendingUAVIdThenCall<TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => TResult,
  { executeOnlyWithoutPendingUAVId } = {} as {
    executeOnlyWithoutPendingUAVId?: boolean;
  }
): (...args: TArgs) => AppThunk<TResult | undefined> {
  return (...args: TArgs) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
      const hadPendingUAVId = handleAndClearPendingUAVId(dispatch, getState);
      if (!hadPendingUAVId || !executeOnlyWithoutPendingUAVId) {
        return func(...args);
      }
      return undefined;
    };
}

/**
 * Helper function that takes a Redux action factory and returns another action
 * factory that creates an action that will 1) first check whether the user has
 * a pending UAV ID typed in via the keyboard, and if so, selects the UAV, and
 * then 2) dispatches the action returned by the original factory with its
 * original arguments
 *
 * @param actionFactory The action factory to wrap.
 * @param executeOnlyWithoutPendingUAVId Whether the function must be called
 *   only if there was no pending UAV.
 */
export function handlePendingUAVIdThenDispatch<TArgs extends unknown[]>(
  actionFactory: (...args: TArgs) => Action<string>,
  { executeOnlyWithoutPendingUAVId } = {} as {
    executeOnlyWithoutPendingUAVId?: boolean;
  }
): (...args: TArgs) => AppThunk {
  return (...args: TArgs) =>
    (dispatch: AppDispatch, getState: () => RootState) => {
      const hadPendingUAVId = handleAndClearPendingUAVId(dispatch, getState);
      if (!hadPendingUAVId || !executeOnlyWithoutPendingUAVId) {
        const action = actionFactory(...args);
        return dispatch(action);
      }
      return undefined;
    };
}

function isValidPendingUAVIdChar(char: string) {
  return typeof char === 'string' && char.length === 1;
}

function appendGroupIdChar(char: string): AppThunk<boolean> {
  return (dispatch, getState) => {
    if (!isValidPendingUAVIdChar(char)) {
      return false;
    }

    let validCharacterTyped = false;
    const pendingUAVId = getPendingUAVId(getState());
    if (char >= '0' && char <= '9') {
      // impose a length limit
      if (pendingUAVId.length < 10) {
        validCharacterTyped = true;
        dispatch(setPendingUAVId(pendingUAVId + char));
      }
    }

    return validCharacterTyped;
  };
}

function appendUAVIdChar(char: string): AppThunk<boolean> {
  return (dispatch, getState) => {
    if (!isValidPendingUAVIdChar(char)) {
      return false;
    }

    let validCharacterTyped = false;
    const pendingUAVId = getPendingUAVId(getState());
    const segment = pendingUAVId.split(':').pop() ?? '';
    if (char >= '0' && char <= '9') {
      // impose a length limit on IDs
      if (segment.length < 10) {
        validCharacterTyped = true;
        dispatch(setPendingUAVId(pendingUAVId + char));
      }
    } else if (char === '-') {
      // Make sure pending UAV is:
      // - not empty
      // - does already contain a minus sign
      // - ends with a number
      if (pendingUAVId.length > 0 && !pendingUAVId.includes('-')) {
        const lastChar = pendingUAVId.slice(-1);
        if (lastChar >= '0' && lastChar <= '9') {
          validCharacterTyped = true;
          dispatch(setPendingUAVId(pendingUAVId + char));
        }
      }
    }

    return validCharacterTyped;
  };
}

/**
 * Appends a new character to the end of the pending UAV ID string that allows
 * the user to select a UAV simply by typing.
 */
export function appendToPendingUAVId(char: string | number): AppThunk<void> {
  return (dispatch, getState) => {
    // 's' and `g` modifiers are only allowed at the beginning,
    // when the pending UAV ID is empty.
    if (char === 's' || char === 'g') {
      dispatch(setPendingUAVId(char));
      dispatch(startPendingUAVIdTimeout());
      return;
    }

    if (typeof char === 'number') {
      char = String(char);
    }

    const mode = getPendingUAVIdMode(getPendingUAVId(getState()));
    let characterAdded = false;
    if (mode === 'uav') {
      characterAdded = dispatch(appendUAVIdChar(char));
    } else if (mode === 'group') {
      characterAdded = dispatch(appendGroupIdChar(char));
    }

    if (characterAdded) {
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
 * if there are any and the alerts are audible; otherwise it exits the mapping
 * editor if the user is currently editing the mapping; otherwise it clears the
 * selection.
 */
export function clearSelectionOrPendingUAVId(): AppThunk<void> {
  return (dispatch, getState) => {
    const state = getState();
    if (isPendingUAVIdOverlayVisible(state)) {
      dispatch(clearPendingUAVId());
    } else if (hasPendingAudibleAlerts(state)) {
      dispatch(dismissAlerts());
    } else if (isMappingEditable(state)) {
      dispatch(finishMappingEditorSession());
    } else {
      dispatch(clearSelection());
    }
  };
}

/**
 * Thunk action that copies the currently displayed map coordinates to the
 * clipboard and then shows a notification to the user.
 */
export const copyCoordinates = (): AppThunk<void> => () => {
  if (copyDisplayedCoordinatesToClipboard()) {
    showNotification('Coordinates copied to clipboard.');
  } else {
    showError('Failed to copy coordinates; are you hovering over the map?');
  }
};

/**
 * Deletes the last character of the pending UAV ID.
 */
export function deleteLastCharacterOfPendingUAVId(): AppThunk<void> {
  return (dispatch, getState) => {
    const pendingUAVId = getPendingUAVId(getState());
    if (pendingUAVId.length > 0) {
      dispatch(setPendingUAVId(pendingUAVId.slice(0, -1)));
      dispatch(startPendingUAVIdTimeout());
    }
  };
}
