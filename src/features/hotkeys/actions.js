import isNil from 'lodash-es/isNil';

import { copyDisplayedCoordinatesToClipboard } from '~/components/map/utils';
import { hasPendingAudibleAlerts } from '~/features/alert/selectors';
import { dismissAlerts } from '~/features/alert/slice';
import { clearSelection } from '~/features/map/selection';
import {
  getGeofencePolygon,
  getMissionMapping,
  isMappingEditable,
} from '~/features/mission/selectors';
import { showError, showNotification } from '~/features/snackbar/actions';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import { getUAVById } from '~/features/uavs/selectors';
import { scrollUAVListItemIntoView } from '~/utils/navigation';

import { finishMappingEditorSession } from '../mission/slice';
import { getPendingUAVId, isPendingUAVIdOverlayVisible } from './selectors';
import { setPendingUAVId, startPendingUAVIdTimeout } from './slice';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';
import { addFeatureById, removeFeaturesByIds } from '../map-features/slice';
import { FeatureType } from '~/model/features';
import { simplifyPolygon } from '~/utils/simplification';

/* Prefixes to try in front of a UAV ID in case the "real" UAV ID has leading
 * zeros */
const LEADING_ZEROS = ['', '0', '00', '000', '0000'];

/**
 * Generator that resolves the string description of a range declaration
 * (inclusive on both ends) into an sequence of *string* identifiers.
 *
 * @param {string} The string description of the range.
 *
 * @yields {string} The identifiers of all items in the range.
 */
function* resolveRange(desc, rangeSeparator = '-') {
  const split = desc.split(rangeSeparator);
  if (split.length > 2) {
    return []; // Invalid input, return an empty array.
  }

  const [startStr, endStr] = split.length == 2 ? split : [split[0], split[0]];
  const start = Number.parseInt(startStr);
  const end = Number.parseInt(endStr);
  if (!(Number.isFinite(start) && Number.isFinite(end) && start <= end)) {
    return []; // Invalid range, return an empty array.
  }

  for (let i = start; i <= end; i++) {
    yield i.toString();
  }
}

/**
 * Resolves the given show index to a selection index.
 *
 * @param {string} value The ID to resolve.
 * @param {Nullable<string>[]} missionMapping Mapping from mission-specific
 *     slots to the corresponding UAV identifiers.
 *
 * @returns {number|undefined} The resolved ID or `undefined`
 *     if the ID could not be resolved.
 */
function showIndexToSelectionIndex(value, missionMapping) {
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
 * @param {string} value The ID to resolve.
 * @param {Nullable<string>[]} missionMapping Mapping from mission-specific
 *     slots to the corresponding UAV identifiers.
 * @param {RootState} state The root redux state.
 *
 * @returns {number|undefined} The resolved ID or `undefined`
 *     if the ID could not be resolved.
 */
function droneIdsToSelectionIndex(value, missionMapping, state) {
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

function handleAndClearPendingUAVId(dispatch, getState) {
  const state = getState();
  let pendingUAVId = getPendingUAVId(state);

  dispatch(clearPendingUAVId());

  if (
    pendingUAVId &&
    typeof pendingUAVId === 'string' &&
    pendingUAVId.length > 0
  ) {
    if (pendingUAVId === '0') {
      dispatch(removeFeaturesByIds(['output']));
      return true;
    }

    const gfp = getGeofencePolygon(getState());
    if (!gfp) {
      dispatch(showError('please define a test geofence polygon to simplify'));
      return true;
    }

    const gfpEasNor = gfp.points.map((c) => mapViewCoordinateFromLonLat(c));

    const simplified = simplifyPolygon(
      [...gfpEasNor, gfpEasNor[0]],
      Number(pendingUAVId)
    );

    if (simplified.isOk()) {
      const outputFeature = {
        type: FeatureType.POLYGON,
        points: simplified.value.map((c) => lonLatFromMapViewCoordinate(c)),
      };

      console.log({ gfp, pendingUAVId, gfpEasNor, outputFeature });

      dispatch(removeFeaturesByIds(['output']));
      dispatch(
        addFeatureById({
          id: 'output',
          feature: outputFeature,
          properties: {
            color: '#00ff00',
          },
        })
      );
      return true;
    } else {
      dispatch(showError(simplified.error));
      return true;
    }

    const newSelection = [];
    const mapping = getMissionMapping(state);

    // Function that expects a single string identifier, the mission mapping, and the root redux state.
    let resolveUAVId;
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

    if (typeof char === 'string' && char.length === 1) {
      const pendingUAVId = getPendingUAVId(getState());
      const segment = pendingUAVId.split(':').pop();
      let validCharacterTyped = false;
      if (char >= '0' && char <= '9') {
        validCharacterTyped = true;
        /* impose a length limit on IDs */
        if (segment.length < 10) {
          dispatch(setPendingUAVId(pendingUAVId + char));
        }
      } else if (char === '-') {
        validCharacterTyped = true;
        // Make sure pending UAV is:
        // - not empty
        // - does already contain a minus sign
        // - ends with a number
        if (pendingUAVId.length > 0 && !pendingUAVId.includes('-')) {
          const lastChar = pendingUAVId.slice(-1);
          if (lastChar >= '0' && lastChar <= '9') {
            dispatch(setPendingUAVId(pendingUAVId + char));
          }
        }
      }

      if (validCharacterTyped) {
        dispatch(startPendingUAVIdTimeout());
      }
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
export function clearSelectionOrPendingUAVId() {
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
