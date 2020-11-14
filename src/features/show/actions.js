import ky from 'ky';
import get from 'lodash-es/get';
import identity from 'lodash-es/identity';
import throttle from 'lodash-es/throttle';

import { addFeature, removeFeature, removeFeatures } from '~/actions/features';
import { Colors } from '~/components/colors';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import {
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
  setMappingLength,
  setGeofencePolygonId,
} from '~/features/mission/slice';
import { getConvexHullOfShow } from '~/features/show/selectors';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import { FeatureType } from '~/model/features';
import { getFeaturesInOrder } from '~/selectors/ordered';
import {
  simplifyPolygon,
  scalePolygon,
  growPolygon,
  bufferPolygon,
} from '~/utils/math';
import { createAsyncAction } from '~/utils/redux';

import { loadShowFromFile as processFile } from './processing';
import {
  getAbsolutePathOfShowFile,
  getFailedUploadItems,
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowCoordinateSystem,
  getShowOrientation,
  getShowCoordinateSystemTransformationObject,
  isUploadInProgress,
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
  startUpload,
  _enqueueFailedUploads,
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

export const removeGeofencePolygon = () => (dispatch, getState) => {
  const state = getState();
  dispatch(removeFeature(getGeofencePolygonId(state)));
};

export const removeShowFeatures = () => (dispatch, getState) => {
  const state = getState();

  const showFeatureIds = getFeaturesInOrder(state)
    .filter((feature) => feature.owner === 'show')
    .map((feature) => feature.id);

  dispatch(removeFeatures(showFeatureIds));
};

export const addGeofencePolygon = () => (dispatch, getState) => {
  const state = getState();

  const {
    horizontalMargin,
    simplify,
    maxVertexCount,
  } = state.dialogs.geofenceSettings;

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

  const showCoordinateSystem = getOutdoorShowCoordinateSystem(state);
  if (
    !showCoordinateSystem.origin ||
    typeof showCoordinateSystem.origin !== 'object'
  ) {
    throw new Error('Outdoor coordinate system not set up yet');
  }

  const transformation = getShowCoordinateSystemTransformationObject(state);

  const MarginType = {
    BUFFER: 'buffer',
    GROW: 'grow',
    SCALE: 'scale',
    NONE: 'none',
  };

  const marginType = MarginType.BUFFER;

  const marginFunctions = {
    [MarginType.BUFFER]: bufferPolygon,
    [MarginType.GROW]: growPolygon,
    [MarginType.SCALE]: scalePolygon,
    [MarginType.NONE]: identity,
  };

  const points = marginFunctions[marginType](coordinates, horizontalMargin);
  const simplifiedPoints = simplify
    ? simplifyPolygon(points, maxVertexCount)
    : points;

  const geofencePolygon = {
    type: FeatureType.POLYGON,
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
  dispatch(addGeofencePolygon());
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
    return { spec, url };
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
    return {
      spec,
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

  // Update the takeoff and landing positions and the takeoff headings in the
  // mission from the loaded show settings
  dispatch(setupMissionFromShow());

  // Revoke the approval of the takeoff area in case it was approved
  dispatch(revokeTakeoffAreaApproval());
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
      const blob = await getFileAsBlob(filename);
      return dispatch(loadShowFromFile(blob));
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
