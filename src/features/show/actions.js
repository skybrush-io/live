import get from 'lodash-es/get';
import throttle from 'lodash-es/throttle';
import ky from 'ky';
import PProgress from 'p-progress';

import { loadShowFromFile as processFile } from './processing';
import {
  getFailedUploadItems,
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowOrientation,
} from './selectors';
import {
  approveTakeoffAreaAt,
  loadingProgress,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setOutdoorShowOrigin,
  setOutdoorShowOrientation,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  _retryFailedUploads,
} from './slice';

import {
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
  setMappingLength,
} from '~/features/mission/slice';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import { createAsyncAction } from '~/utils/redux';

/**
 * Thunk that approves the takeoff area arrangement with the current timestamp.
 */
export const approveTakeoffArea = () => (dispatch) => {
  dispatch(approveTakeoffAreaAt(Date.now()));
};

/**
 * Updates the takeoff and landing positions and the takeoff headings in the
 * current mission from the show settings and trajectories.
 */
export const setupMissionFromShow = () => (dispatch, getState) => {
  const state = getState();

  // TODO(ntamas): map these to GPS coordinates only if the show is outdoor
  const homePositions = getFirstPointsOfTrajectoriesInWorldCoordinates(state);
  const landingPositions = getLastPointsOfTrajectoriesInWorldCoordinates(state);
  const orientation = getOutdoorShowOrientation(state);

  dispatch(updateHomePositions(homePositions));
  dispatch(updateLandingPositions(landingPositions));
  dispatch(updateTakeoffHeadings(orientation));
};

export const updateOutdoorShowSettings = ({
  origin,
  orientation,
  setupMission,
}) => (dispatch) => {
  let changed = false;

  if (origin) {
    dispatch(setOutdoorShowOrigin(origin));
    changed = true;
  }

  if (orientation) {
    dispatch(setOutdoorShowOrientation(orientation));
    changed = true;
  }

  if (setupMission && changed) {
    dispatch(setupMissionFromShow());
  }
};

const createShowLoaderThunkFactory = (
  dataSourceToShowSpecification,
  options = {}
) => {
  const { errorMessage } = options;

  /**
   * First, format-specific step of the show loading process that takes a show
   * file from some data source (given as input arguments), and converts it
   * into JSON format, resolving JSON references where needed so we have a
   * single JSON object in the end.
   */
  const actionFactory = createAsyncAction(
    'show/loading',
    dataSourceToShowSpecification,
    { minDelay: 500 }
  );

  return (arg) => async (dispatch, getState) => {
    const onProgress = throttle((progress) => {
      dispatch({
        type: loadingProgress.type,
        payload: progress,
      });
    }, 200);
    try {
      const promise = dispatch(
        actionFactory(arg, { dispatch, getState, onProgress })
      );
      const { value: spec } = await promise;
      processShowInJSONFormatAndDispatchActions(spec, dispatch);
    } catch (error) {
      dispatch(
        showNotification({
          message: errorMessage || 'Failed to load show.',
          semantics: MessageSemantics.ERROR,
          permanent: true,
        })
      );
      console.error(error);
    }
  };
};

/**
 * Thunk that creates an async action that loads a drone show from a Skybrush
 * compiled drone show file.
 *
 * The thunk must be invoked with the file that the user wants to open
 * the show from.
 */
export const loadShowFromFile = createShowLoaderThunkFactory(
  (file) => processFile(file),
  {
    errorMessage: 'Failed to load show from the given file.',
  }
);

/**
 * Thunk that creates an async action that loads a drone show from a Skybrush
 * compiled drone show file provided at a remote URL.
 *
 * The thunk must be invoked with the URL that the user wants to open
 * the show from.
 */
export const loadShowFromUrl = createShowLoaderThunkFactory(
  async (url, { onProgress }) => {
    const response = await ky(url, {
      onDownloadProgress: (info) => {
        if (info.totalBytes > 0) {
          onProgress(info.percent);
        }
      },
    }).arrayBuffer();
    return processFile(response);
  },
  {
    errorMessage: 'Failed to load show from the given URL.',
  }
);

/**
 * Second step of the show loading process that takes a show in JSON format
 * and dispatches the appropriate actions to update the state store with the
 * new show.
 */
function processShowInJSONFormatAndDispatchActions(spec, dispatch) {
  const drones = get(spec, 'swarm.drones');
  dispatch(setMappingLength(drones.length));

  const environment = get(spec, 'environment');
  if (environment.type) {
    dispatch(setEnvironmentType(environment.type));
  }

  // TODO(ntamas): if the number of drones is different than the number of
  // drones in the previous file, it is probably a completely new show so
  // we should forget the show coordinate system completely

  // Update the takeoff and landing positions and the takeoff headings in the
  // mission from the loaded show settings
  dispatch(setupMissionFromShow());

  // Revoke the approval of the takeoff area in case it was approved
  dispatch(revokeTakeoffAreaApproval());
}

/**
 * Thunk that retrieves all failed upload items from the state and then
 * places all of them in the upload queue.
 */
export function retryFailedUploads() {
  return (dispatch, getState) => {
    const failedItems = getFailedUploadItems(getState());
    dispatch(_retryFailedUploads(failedItems));
  };
}

/**
 * Thunk that signs off on the manual preflight checks with the current
 * timestamp.
 */
export const signOffOnManualPreflightChecks = () => (dispatch) => {
  dispatch(signOffOnManualPreflightChecksAt(Date.now()));
};

/**
 * Thunk that signs off on the onboard preflight checks with the current
 * timestamp.
 */
export const signOffOnOnboardPreflightChecks = () => (dispatch) => {
  dispatch(signOffOnOnboardPreflightChecksAt(Date.now()));
};
