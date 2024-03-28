/**
 * Functions related to retrieving values of mission parameters from the user
 * interface.
 *
 * Missions may have two types of parameters: those that are to be provided
 * explicitly by the user when planning or starting the mission, and those that
 * are to be inferred from the UI context (such as the coordinate of the
 * selected drone, or the coordinates of the selected feature on the map).
 *
 * The contents of this module specifies the methods we support for inferring
 * the values of parameters from the UI context.
 */

import {
  getFeatureById,
  getSingleSelectedFeatureIdOfType,
} from '~/features/map-features/selectors';
import {
  getCurrentGPSPositionByUavId,
  getSingleSelectedUAVId,
} from '~/features/uavs/selectors';
import { FeatureType } from '~/model/features';
import {
  toScaledJSONFromLonLat,
  toScaledJSONFromObject,
} from '~/utils/geography';
import {
  getEndRatioOfPartialMission,
  getExclusionZonePolygons,
  getGlobalMissionCompletionRatio,
} from './selectors';

export const ParameterUIContext = {
  EXCLUSION_ZONE_POLYGONS: 'exclusionZonePolygons',
  NET_MISSION_END_RATIO: 'netMissionEndRatio',
  NET_MISSION_START_RATIO: 'netMissionStartRatio',
  SELECTED_COORDINATE: 'selectedCoordinate',
  SELECTED_LINE_STRING_FEATURE: 'selectedLineStringFeature',
  SELECTED_MARKER_FEATURE: 'selectedMarkerFeature',
  SELECTED_POLYGON_FEATURE: 'selectedPolygonFeature',
  SELECTED_UAV_COORDINATE: 'selectedUAVCoordinate',
};

export const KNOWN_UI_CONTEXTS = Object.values(ParameterUIContext);

export const ContextVolatility = {
  DYNAMIC: 'dynamic',
  STATIC: 'static',
};

export const contextVolatilities = {
  [ParameterUIContext.EXCLUSION_ZONE_POLYGONS]: ContextVolatility.DYNAMIC,
  [ParameterUIContext.NET_MISSION_END_RATIO]: ContextVolatility.DYNAMIC,
  [ParameterUIContext.NET_MISSION_START_RATIO]: ContextVolatility.DYNAMIC,
  [ParameterUIContext.SELECTED_COORDINATE]: ContextVolatility.DYNAMIC,
  [ParameterUIContext.SELECTED_LINE_STRING_FEATURE]: ContextVolatility.STATIC,
  [ParameterUIContext.SELECTED_MARKER_FEATURE]: ContextVolatility.DYNAMIC,
  [ParameterUIContext.SELECTED_POLYGON_FEATURE]: ContextVolatility.STATIC,
  [ParameterUIContext.SELECTED_UAV_COORDINATE]: ContextVolatility.DYNAMIC,
};

/**
 * Function that retrieves an object mapping UI context identifiers to parameter
 * names and the state getter function of the top-level store, and returns an
 * object mapping the parameter names to their current values as provided by
 * the UI context.
 *
 * @param {Map} parameterNamesByContext  map from UI context identifiers to
 *        arrays of parameter names
 * @param {func} getState  the state getter function of the top-level store
 * @returns an object mapping parameter names to the corresponding values as
 *          provided by the state object
 */
export function getParametersFromContext(parameterNamesByContext, getState) {
  const state = getState();
  const result = {};

  for (const [contextId, parameterNames] of Object.entries(
    parameterNamesByContext
  )) {
    const handler = contextHandlers[contextId];

    if (handler && typeof handler === 'function') {
      assign(result, parameterNames, handler(state));
    }
  }

  return result;
}

/**
 * Helper function that assigns the same value to multiple keys in the given
 * object.
 */
function assign(result, keys, value) {
  if (typeof keys === 'string') {
    keys = [keys];
  }

  for (const key of keys) {
    result[key] = value;
  }
}

/**
 * Gets the list of polygons that are marked as exclusion zones.
 */
const getExclusionZonePolygonsFromContext = (state) =>
  getExclusionZonePolygons(state).map(({ attributes, points }) => ({
    points: points.map(toScaledJSONFromLonLat),
    altitude: {
      min: attributes?.minAltitude,
      max: attributes?.maxAltitude,
    },
  }));

/**
 * Gets the net mission end ratio.
 */
const getNetMissionEndRatioFromContext = getEndRatioOfPartialMission;

/**
 * Gets the completion ratio of the net mission from the store.
 */
const getNetMissionStartRatioFromContext = getGlobalMissionCompletionRatio;

/**
 * Gets the coordinates of the selected UAV from the store.
 */
const getSingleSelectedUAVCoordinateFromContext = (state) => {
  const uavId = getSingleSelectedUAVId(state);
  if (!uavId) {
    throw new Error('Exactly one UAV must be selected');
  }

  const uavPosition = getCurrentGPSPositionByUavId(state, uavId);
  if (!uavPosition) {
    throw new Error('The selected UAV does not have a GPS position yet');
  }

  return toScaledJSONFromObject(uavPosition);
};

/**
 * Generic utility function to get a selected feature of a given type from the
 * store, or throw the appropriate error if that is not possible.
 */
const getSingleSelectedFeatureOfTypeFromContext = (featureType) => (state) => {
  const featureId = getSingleSelectedFeatureIdOfType(featureType)(state);
  if (!featureId) {
    throw new Error(
      `Exactly one feature of type '${featureType}' must be selected on the map`
    );
  }

  return getFeatureById(state, featureId);
};

/**
 * Gets the selected linestring from the store.
 */
const getSingleSelectedLineStringFromContext = (state) => ({
  points: getSingleSelectedFeatureOfTypeFromContext(FeatureType.LINE_STRING)(
    state
  ).points.map(toScaledJSONFromLonLat),
});

/**
 * Gets the selected marker from the store.
 */
const getSingleSelectedMarkerFromContext = (state) => ({
  points: getSingleSelectedFeatureOfTypeFromContext(FeatureType.POINTS)(
    state
  ).points.map(toScaledJSONFromLonLat),
});

/**
 * Gets the selected polygon from the store.
 */
const getSingleSelectedPolygonFromContext = (state) => {
  const feature = getSingleSelectedFeatureOfTypeFromContext(
    FeatureType.POLYGON
  )(state);

  return {
    points: feature.points.map(toScaledJSONFromLonLat),
    holes: feature.holes.map((hole) => hole.map(toScaledJSONFromLonLat)),
  };
};

/**
 * Gets a selected coordinate from the store, which belongs to either a UAV
 * or a marker feature on the map.
 */
const getSelectedCoordinateFromContext = (state) => {
  try {
    return getSingleSelectedUAVCoordinateFromContext(state);
  } catch {
    try {
      return getSingleSelectedMarkerFromContext(state);
    } catch {
      throw new Error(
        'Exactly one UAV or exactly one marker must be selected!'
      );
    }
  }
};

const contextHandlers = {
  [ParameterUIContext.EXCLUSION_ZONE_POLYGONS]:
    getExclusionZonePolygonsFromContext,
  [ParameterUIContext.NET_MISSION_END_RATIO]: getNetMissionEndRatioFromContext,
  [ParameterUIContext.NET_MISSION_START_RATIO]:
    getNetMissionStartRatioFromContext,
  [ParameterUIContext.SELECTED_COORDINATE]: getSelectedCoordinateFromContext,
  [ParameterUIContext.SELECTED_LINE_STRING_FEATURE]:
    getSingleSelectedLineStringFromContext,
  [ParameterUIContext.SELECTED_MARKER_FEATURE]:
    getSingleSelectedMarkerFromContext,
  [ParameterUIContext.SELECTED_POLYGON_FEATURE]:
    getSingleSelectedPolygonFromContext,
  [ParameterUIContext.SELECTED_UAV_COORDINATE]:
    getSingleSelectedUAVCoordinateFromContext,
};
