import ky from 'ky';
import get from 'lodash-es/get';
import throttle from 'lodash-es/throttle';

import { freeze } from '@reduxjs/toolkit';

import { addFeature, removeFeatures } from '~/actions/features';
import { Colors } from '~/components/colors';
import { removeGeofencePolygon } from '~/features/mission/actions';
import {
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
  setMappingLength,
  setGeofencePolygonId,
} from '~/features/mission/slice';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import { FeatureType } from '~/model/features';
import { getFeaturesInOrder } from '~/selectors/ordered';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';
import { simplifyPolygon, bufferPolygon } from '~/utils/math';
import { createAsyncAction } from '~/utils/redux';

import { StartMethod } from './enums';
import { loadShowFromFile as processFile } from './processing';
import {
  getAbsolutePathOfShowFile,
  getConvexHullOfShow,
  getFailedUploadItems,
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowOrigin,
  getRoomCorners,
  getShowOrientation,
  getSuccessfulUploadItems,
  getOutdoorShowAltitudeReference,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  isItemInUploadBacklog,
  isUploadInProgress,
} from './selectors';
import {
  approveTakeoffAreaAt,
  clearLastUploadResult,
  loadingProgress,
  putUavInWaitingQueue,
  removeUavFromWaitingQueue,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setLastLoadingAttemptFailed,
  setOutdoorShowOrigin,
  setOutdoorShowOrientation,
  setRoomCorners,
  setStartMethod,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  startUpload,
  _enqueueFailedUploads,
  _enqueueSuccessfulUploads,
  _setOutdoorShowAltitudeReference,
} from './slice';

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
  const orientation = getShowOrientation(state);

  dispatch(updateHomePositions(homePositions));
  dispatch(updateLandingPositions(landingPositions));
  dispatch(updateTakeoffHeadings(orientation));
};

export const removeShowFeatures = () => (dispatch, getState) => {
  const state = getState();

  const showFeatureIds = getFeaturesInOrder(state)
    .filter((feature) => feature.owner === 'show')
    .map((feature) => feature.id);

  dispatch(removeFeatures(showFeatureIds));
};

const addGeofencePolygonBasedOnShowTrajectories =
  () => (dispatch, getState) => {
    const state = getState();

    const { horizontalMargin, simplify, maxVertexCount } =
      state.dialogs.geofenceSettings;

    const coordinates = getConvexHullOfShow(state);
    if (coordinates.length === 0) {
      dispatch(
        showNotification({
          message: `Could not calculate geofence coordinates. Did you load a show file?`,
          semantics: MessageSemantics.ERROR,
          permanent: true,
        })
      );
      return;
    }

    const transformation =
      getOutdoorShowToWorldCoordinateSystemTransformationObject(state);
    if (!transformation) {
      throw new Error('Outdoor coordinate system not set up yet');
    }

    const points = bufferPolygon(coordinates, horizontalMargin);
    const simplifiedPoints = simplify
      ? simplifyPolygon(points, maxVertexCount)
      : points;

    const geofencePolygon = {
      /* use a line string as the geofence, not a polygon -- if we use a polygon,
       * it means that any click inside the geofence would be considered as a
       * "hit" for the geofence feature */
      type: FeatureType.LINE_STRING,
      owner: 'show',
      /* don't use a label; the geofence usually overlaps with the convex hull of
       * the show so it is confusing if the "Geofence" label appears in the middle
       * of the convex hull */
      color: Colors.geofence,
      points: simplifiedPoints.map((c) => transformation.toLonLat(c)),
    };
    const action = addFeature(geofencePolygon);
    dispatch(action);
    dispatch(setGeofencePolygonId(action.featureId));
  };

export const updateGeofencePolygon = () => (dispatch) => {
  dispatch(removeGeofencePolygon());
  dispatch(addGeofencePolygonBasedOnShowTrajectories());
};

/**
 * Moves the show origin relative to its current position such that the delta
 * is expressed in map view coordinates.
 */
export const moveOutdoorShowOriginByMapCoordinateDelta =
  (delta) => (dispatch, getState) => {
    const origin = getOutdoorShowOrigin(getState());
    const originInMapView = mapViewCoordinateFromLonLat(origin);
    const newOriginInMapView = [
      originInMapView[0] + delta[0],
      originInMapView[1] + delta[1],
    ];
    const newOrigin = lonLatFromMapViewCoordinate(newOriginInMapView);

    dispatch(
      updateOutdoorShowSettings({ origin: newOrigin, setupMission: true })
    );
  };

export const updateOutdoorShowSettings =
  ({ origin, orientation, setupMission }) =>
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
      onDownloadProgress: (info) => {
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

  // TODO(ntamas): if the number of drones is different than the number of
  // drones in the previous file, it is probably a completely new show so
  // we should forget the show coordinate system completely
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
 * Thunk that restarts the upload process on all UAVs that are currently
 * marked as successful.
 */
export function restartSuccessfulUploads() {
  return (dispatch, getState) => {
    const successfulItems = getSuccessfulUploadItems(getState());
    dispatch(_enqueueSuccessfulUploads(successfulItems));
    if (!isUploadInProgress(getState())) {
      dispatch(startUpload());
    }
  };
}

/**
 * Thunk that retrieves all failed upload items from the state, places all of
 * them in the upload queue and then restarts the upload process if needed.
 */
export function retryFailedUploads() {
  return (dispatch, getState) => {
    const failedItems = getFailedUploadItems(getState());
    dispatch(_enqueueFailedUploads(failedItems));
    if (!isUploadInProgress(getState())) {
      dispatch(startUpload());
    }
  };
}

/**
 * Toggles a single UAV into our out of the upload queue, assuming that it is
 * in a state where such modification is allowed.
 */
export function toggleUavInWaitingQueue(uavId) {
  return (dispatch, getState) => {
    const state = getState();
    if (isItemInUploadBacklog(state, uavId)) {
      dispatch(removeUavFromWaitingQueue(uavId));
    } else {
      dispatch(putUavInWaitingQueue(uavId));
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
