import get from 'lodash-es/get';
import pMinDelay from 'p-min-delay';

import { loadShowFromFile as processFile } from './processing';
import {
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowOrientation
} from './selectors';
import {
  approveTakeoffAreaAt,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  _setOutdoorShowOrientation
} from './slice';

import {
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
  setMappingLength
} from '~/features/mission/slice';
import { showSnackbarMessage } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import { createAsyncAction } from '~/utils/redux';

/**
 * Thunk that approves the takeoff area arrangement with the current timestamp.
 */
export const approveTakeoffArea = () => dispatch => {
  dispatch(approveTakeoffAreaAt(Date.now()));
};

const loadShowFromFileInner = createAsyncAction('show/loading', async file => {
  return pMinDelay(processFile(file), 500);
});

/**
 * Thunk that creates an async action that loads a drone show from a Skybrush
 * compiled drone show file.
 *
 * The thunk must be invoked with the file that the user wants to open
 * the show from.
 */
export const loadShowFromFile = file => async (dispatch, getState) => {
  let result;

  try {
    result = await dispatch(loadShowFromFileInner(file));
  } catch (error) {
    dispatch(
      showSnackbarMessage({
        message: 'Failed to load show from the given file.',
        semantics: MessageSemantics.ERROR,
        permanent: true
      })
    );
    console.error(error);
    return;
  }

  const spec = result.value;
  const drones = get(spec, 'swarm.drones');
  dispatch(setMappingLength(drones.length));

  const environment = get(spec, 'environment');
  if (environment.type) {
    dispatch(setEnvironmentType(environment.type));
  }

  // TODO(ntamas): map this to GPS coordinates only if the show is outdoor
  const state = getState();
  const homePositions = getFirstPointsOfTrajectoriesInWorldCoordinates(state);
  const landingPositions = getLastPointsOfTrajectoriesInWorldCoordinates(state);
  const orientation = getOutdoorShowOrientation(state);

  dispatch(updateHomePositions(homePositions));
  dispatch(updateLandingPositions(landingPositions));
  dispatch(updateTakeoffHeadings(orientation));

  // Revoke the approval of the takeoff area in case it was approved
  dispatch(revokeTakeoffAreaApproval());
};

export const setOutdoorShowOrientationAndUpdateTakeoffHeadings = orientation => (
  dispatch,
  getState
) => {
  dispatch(_setOutdoorShowOrientation(orientation));

  const state = getState();
  const orientation = getOutdoorShowOrientation(state);

  dispatch(updateTakeoffHeadings(orientation));
};

/**
 * Thunk that signs off on the manual preflight checks with the current
 * timestamp.
 */
export const signOffOnManualPreflightChecks = () => dispatch => {
  dispatch(signOffOnManualPreflightChecksAt(Date.now()));
};

/**
 * Thunk that signs off on the onboard preflight checks with the current
 * timestamp.
 */
export const signOffOnOnboardPreflightChecks = () => dispatch => {
  dispatch(signOffOnOnboardPreflightChecksAt(Date.now()));
};
