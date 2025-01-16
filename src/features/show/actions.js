import ky from 'ky';
import get from 'lodash-es/get';
import sum from 'lodash-es/sum';
import throttle from 'lodash-es/throttle';
import Point from 'ol/geom/Point';

import { freeze } from '@reduxjs/toolkit';

import { loadCompiledShow as processFile } from '@skybrush/show-format';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { getFeaturesInOrder } from '~/features/map-features/selectors';
import {
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
  setMappingLength,
  setMissionType,
  setCommandsAreBroadcast,
} from '~/features/mission/slice';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import {
  getCurrentGPSPositionByUavId,
  getActiveUAVIds,
} from '~/features/uavs/selectors';
import { clearLastUploadResultForJobType } from '~/features/upload/slice';
import { MissionType } from '~/model/missions';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  translateLonLatWithMapViewDelta,
} from '~/utils/geography';
import { toRadians } from '~/utils/math';
import { createAsyncAction } from '~/utils/redux';

import { JOB_TYPE } from './constants';
import { StartMethod } from './enums';
import {
  getAbsolutePathOfShowFile,
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowOrigin,
  getRoomCorners,
  getOutdoorShowAltitudeReference,
  getOutdoorShowOrientation,
  getCommonTakeoffHeading,
  getShowClockReference,
  hasScheduledStartTime,
} from './selectors';
import {
  approveTakeoffAreaAt,
  loadingProgress,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setLastLoadingAttemptFailed,
  setOutdoorShowOrigin,
  setOutdoorShowOrientation,
  setOutdoorShowTakeoffHeadingSpecification,
  setRoomCorners,
  setStartMethod,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  _setOutdoorShowAltitudeReference,
  _clearLoadedShow,
  setStartTime,
  synchronizeShowSettings,
  setShowAuthorization,
} from './slice';

/**
 * Thunk that approves the takeoff area arrangement with the current timestamp.
 */
export const approveTakeoffArea = () => (dispatch) => {
  dispatch(approveTakeoffAreaAt(Date.now()));
};

/**
 * Thunk that authorizes the start of the show if it has a scheduled start time
 * and deauthorizes it if it does not have a scheduled start time.
 */
export const authorizeIfAndOnlyIfHasStartTime = () => (dispatch, getState) => {
  const shouldAuthorize = hasScheduledStartTime(getState());
  dispatch(setShowAuthorization(shouldAuthorize));
  if (shouldAuthorize) {
    dispatch(setCommandsAreBroadcast(true));
  }
};

/**
 * Returns an action that clears the last show upload result from the upload
 * history.
 */
export const clearLastUploadResult = () =>
  clearLastUploadResultForJobType(JOB_TYPE);

/**
 * Thunk that clears the currently loaded show and sets the type of the
 * currently loaded mission to unknown.
 */
export const clearLoadedShow = () => (dispatch) => {
  dispatch(_clearLoadedShow());
  dispatch(setMissionType(MissionType.UNKNOWN));
};

/**
 * Think that clears the start time of the show, keeping its start method.
 */
export const clearStartTime = () => (dispatch, getState) => {
  const clock = getShowClockReference(getState());
  dispatch(setStartTime({ clock, time: undefined }));
  dispatch(synchronizeShowSettings('toServer'));
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
  const takeoffHeading = getCommonTakeoffHeading(state);

  dispatch(setMissionType(MissionType.SHOW));
  dispatch(updateHomePositions(homePositions));
  dispatch(updateLandingPositions(landingPositions));
  dispatch(updateTakeoffHeadings(takeoffHeading));
};

export const removeShowFeatures = () => (dispatch, getState) => {
  const state = getState();

  const showFeatureIds = getFeaturesInOrder(state)
    .filter((feature) => feature.owner === 'show')
    .map((feature) => feature.id);

  dispatch(removeFeaturesByIds(showFeatureIds));
};

/**
 * Moves the show origin relative to its current position such that the delta
 * is expressed in map view coordinates.
 */
export const moveOutdoorShowOriginByMapCoordinateDelta =
  (delta) => (dispatch, getState) => {
    const origin = getOutdoorShowOrigin(getState());
    const newOrigin = translateLonLatWithMapViewDelta(origin, delta);
    dispatch(
      updateOutdoorShowSettings({ origin: newOrigin, setupMission: true })
    );
  };

/**
 * Rotates the show origin by the given angle in degrees, snapping to one
 * decimal digit.
 */
export const rotateOutdoorShowOrientationByAngle =
  (delta) => (dispatch, getState) => {
    const orientation = getOutdoorShowOrientation(getState());
    const newOrientation = orientation + delta;

    if (Number.isFinite(newOrientation)) {
      dispatch(
        updateOutdoorShowSettings({
          orientation: newOrientation.toFixed(1),
          setupMission: true,
        })
      );
    }
  };

/**
 * Rotates the show origin by the given angle in degrees around a given point,
 * snapping the angle to one decimal digit.
 */
export const rotateOutdoorShowOrientationByAngleAroundPoint =
  (angle, rotationOriginInMapCoordinates) => (dispatch, getState) => {
    const showOriginInMapCoordinates = mapViewCoordinateFromLonLat(
      getOutdoorShowOrigin(getState())
    );
    const showOriginPoint = new Point(showOriginInMapCoordinates);
    showOriginPoint.rotate(toRadians(-angle), rotationOriginInMapCoordinates);
    const newOrigin = lonLatFromMapViewCoordinate(
      showOriginPoint.flatCoordinates
    );

    dispatch(setOutdoorShowOrigin(newOrigin));
    dispatch(rotateOutdoorShowOrientationByAngle(angle));
  };

export const updateOutdoorShowSettings =
  ({ origin, orientation, takeoffHeading, setupMission }) =>
  (dispatch) => {
    let changed = false;

    if (origin) {
      dispatch(setOutdoorShowOrigin(origin));
      changed = true;
    }

    if (orientation) {
      dispatch(setOutdoorShowOrientation(orientation));
      changed = true;
    }

    if (takeoffHeading) {
      dispatch(setOutdoorShowTakeoffHeadingSpecification(takeoffHeading));
      changed = true;
    }

    if (changed) {
      dispatch(clearLastUploadResult());

      if (setupMission) {
        dispatch(setupMissionFromShow());
      }
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

    dispatch(setLastLoadingAttemptFailed(false));
    dispatch(clearLastUploadResult());

    try {
      const promise = dispatch(
        actionFactory(arg, { dispatch, getState, onProgress })
      );
      const {
        value: { spec },
      } = await promise;
      processShowInJSONFormatAndDispatchActions(spec, dispatch);
    } catch (error) {
      dispatch(
        showNotification({
          message: errorMessage || 'Failed to load show.',
          semantics: MessageSemantics.ERROR,
          permanent: true,
        })
      );
      dispatch(setLastLoadingAttemptFailed(true));
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
  async (file) => {
    const url = file && file.path ? `file://${file.path}` : undefined;
    const spec = await processFile(file);
    // Pre-freeze the show data shallowly to give a hint to Redux Toolkit that
    // the show content won't change
    return { spec: freeze(spec), url };
  },
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
      onDownloadProgress(info) {
        if (info.totalBytes > 0) {
          onProgress(info.percent);
        }
      },
    }).arrayBuffer();

    const spec = await processFile(response);

    // Pre-freeze the show data shallowly to give a hint to Redux Toolkit that
    // the show content won't change
    return {
      spec: freeze(spec),
      url,
    };
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

  if (environment.type === 'indoor') {
    dispatch(setOutdoorShowOrigin(null));
  }

  // Update the takeoff and landing positions and the takeoff headings in the
  // mission from the loaded show settings
  dispatch(setupMissionFromShow());

  // Revoke the approval of the takeoff area in case it was approved
  dispatch(revokeTakeoffAreaApproval());

  // For indoor shows we use automatic start by default, not using an RC
  if (environment.type === 'indoor') {
    dispatch(setStartMethod(StartMethod.AUTO));
  }
}

/**
 * Thunk that attempts to reload the currently loaded show file.
 */
export function reloadCurrentShowFile() {
  return async (dispatch, getState) => {
    const { getFileAsBlob } = window.bridge;

    if (!getFileAsBlob) {
      console.warn('reloadCurrentShowFile() works only in Electron');
      return;
    }

    const filename = getAbsolutePathOfShowFile(getState());
    if (filename) {
      const { buffer, props } = await getFileAsBlob(filename);
      const blob = new Blob([buffer]);
      Object.assign(blob, props);
      return dispatch(loadShowFromFile(blob));
    }
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

export const setFirstCornerOfRoom = (newCorner) => (dispatch, getState) => {
  const corners = getRoomCorners(getState());
  dispatch(setRoomCorners([newCorner, corners[1]]));
};

export const setSecondCornerOfRoom = (newCorner) => (dispatch, getState) => {
  const corners = getRoomCorners(getState());
  dispatch(setRoomCorners([corners[0], newCorner]));
};

export const setOutdoorShowAltitudeReferenceType =
  (type) => (dispatch, getState) => {
    dispatch(
      _setOutdoorShowAltitudeReference({
        ...getOutdoorShowAltitudeReference(getState()),
        type,
      })
    );
    dispatch(clearLastUploadResult());
  };

export const setOutdoorShowAltitudeReferenceValue =
  (value) => (dispatch, getState) => {
    const altitude = Number(value);
    if (Number.isFinite(altitude) && altitude >= -10000 && altitude <= 10000) {
      dispatch(
        _setOutdoorShowAltitudeReference({
          ...getOutdoorShowAltitudeReference(getState()),
          value: altitude,
        })
      );
      dispatch(clearLastUploadResult());
    }
  };

export const setOutdoorShowAltitudeReferenceToAverageAMSL =
  () => (dispatch, getState) => {
    const state = getState();
    const activeUAVIds = getActiveUAVIds(state);
    const altitudes = [];

    for (const uavId of activeUAVIds) {
      const pos = getCurrentGPSPositionByUavId(state, uavId);
      if (pos && typeof pos.amsl === 'number' && Number.isFinite(pos.amsl)) {
        altitudes.push(pos.amsl);
      }
    }

    if (altitudes.length > 0) {
      const avgAltitude = sum(altitudes) / altitudes.length;
      dispatch(setOutdoorShowAltitudeReferenceValue(avgAltitude.toFixed(1)));
    }
  };
