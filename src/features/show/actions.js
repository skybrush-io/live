import ky from 'ky';
import get from 'lodash-es/get';
import sum from 'lodash-es/sum';
import throttle from 'lodash-es/throttle';
import Point from 'ol/geom/Point';

import { freeze } from '@reduxjs/toolkit';

import { Colors } from '~/components/colors';
import {
  addFeatureById,
  removeFeaturesByIds,
} from '~/features/map-features/slice';
import { getProposedIdForNewFeature } from '~/features/map-features/selectors';
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
import {
  getCurrentGPSPositionByUavId,
  getActiveUAVIds,
} from '~/features/uavs/selectors';
import { clearLastUploadResultForJobType } from '~/features/upload/slice';
import { FeatureType, LabelStyle } from '~/model/features';
import { getFeaturesInOrder } from '~/selectors/ordered';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  translateLonLatWithMapViewDelta,
} from '~/utils/geography';
import { bufferPolygon, simplifyPolygon, toRadians } from '~/utils/math';
import { createAsyncAction } from '~/utils/redux';

import { JOB_TYPE } from './constants';
import { StartMethod } from './enums';
import { loadShowFromFile as processFile } from './processing';
import {
  getAbsolutePathOfShowFile,
  getConvexHullOfShow,
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowOrigin,
  getRoomCorners,
  getShowOrientation,
  getOutdoorShowAltitudeReference,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  getOutdoorShowOrientation,
} from './selectors';
import {
  approveTakeoffAreaAt,
  loadingProgress,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setLastLoadingAttemptFailed,
  setOutdoorShowOrigin,
  setOutdoorShowOrientation,
  setRoomCorners,
  setStartMethod,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  _setOutdoorShowAltitudeReference,
} from './slice';

/**
 * Thunk that approves the takeoff area arrangement with the current timestamp.
 */
export const approveTakeoffArea = () => (dispatch) => {
  dispatch(approveTakeoffAreaAt(Date.now()));
};

/**
 * Returns an action that clears the last show upload result from the upload
 * history.
 */
export const clearLastUploadResult = () =>
  clearLastUploadResultForJobType(JOB_TYPE);

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

  dispatch(removeFeaturesByIds(showFeatureIds));
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
      label: 'Geofence',
      labelStyle: LabelStyle.HIDDEN,
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
    const geofencePolygonId = getProposedIdForNewFeature(
      state,
      geofencePolygon
    );
    dispatch(
      addFeatureById({ feature: geofencePolygon, id: geofencePolygonId })
    );
    dispatch(setGeofencePolygonId(geofencePolygonId));
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
