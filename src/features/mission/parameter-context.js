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
  getGlobalMissionCompletionRatio,
} from './selectors';

export const ParameterUIContext = {
  NET_MISSION_END_RATIO: 'netMissionEndRatio',
  NET_MISSION_START_RATIO: 'netMissionStartRatio',
  SELECTED_COORDINATE: 'selectedCoordinate',
  SELECTED_LINE_STRING_FEATURE: 'selectedLineStringFeature',
  SELECTED_MARKER_FEATURE: 'selectedMarkerFeature',
  SELECTED_POLYGON_FEATURE: 'selectedPolygonFeature',
  SELECTED_UAV_COORDINATE: 'selectedUAVCoordinate',
};

export const KNOWN_UI_CONTEXTS = Object.values(ParameterUIContext);

/**
 * Function that retrieves a map from UI context identifiers to parameter
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
  const result = {};

  for (const [contextId, parameterNames] of Object.entries(
    parameterNamesByContext
  )) {
    const handler = contextHandlers[contextId];

    if (handler && typeof handler === 'function') {
      handler(result, parameterNames, getState);
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
 * Constantly assigns 1 as the net mission end ratio to the listed variables in
 * the result object.
 */
function extractNetMissionEndRatioFromContext(
  result,
  parameterNames,
  getState
) {
  const state = getState();
  assign(result, parameterNames, getEndRatioOfPartialMission(state));
}

/**
 * Extracts the completion ratio of the net mission from the store and assigns
 * its value to the listed variables in the result object.
 */
function extractNetMissionStartRatioFromContext(
  result,
  parameterNames,
  getState
) {
  const state = getState();
  assign(result, parameterNames, getGlobalMissionCompletionRatio(state));
}

/**
 * Extracts the selected UAV from the store and assigns its coordinates to the
 * listed variables in the result object.
 */
function extractSingleSelectedUAVCoordinateFromContext(
  result,
  parameterNames,
  getState
) {
  const state = getState();

  const uavId = getSingleSelectedUAVId(state);
  if (!uavId) {
    throw new Error('Exactly one UAV must be selected');
  }

  const uavPosition = getCurrentGPSPositionByUavId(state, uavId);
  if (!uavPosition) {
    throw new Error('The selected UAV does not have a GPS position yet');
  }

  assign(result, parameterNames, toScaledJSONFromObject(uavPosition));
}

/**
 * Generic utility function to get a selected feature of a given type from the
 * store, or throw the appropriate error if that is not possible.
 */
const extractSingleSelectedFeatureOfTypeFromContext =
  (featureType) => (getState) => {
    const state = getState();

    const featureId = getSingleSelectedFeatureIdOfType(featureType)(state);
    if (!featureId) {
      throw new Error(
        `Exactly one feature of type '${featureType}' must be selected on the map`
      );
    }

    return getFeatureById(state, featureId);
  };

/**
 * Extracts the selected linestring from the store and assigns its coordinates
 * to the listed variables in the result object.
 */
function extractSingleSelectedLineStringFromContext(
  result,
  parameterNames,
  getState
) {
  const feature = extractSingleSelectedFeatureOfTypeFromContext(
    FeatureType.LINE_STRING
  )(getState);

  assign(result, parameterNames, feature.points.map(toScaledJSONFromLonLat));
}

/**
 * Extracts the selected marker from the store and assigns its coordinates to
 * the listed variables in the result object.
 */
function extractSingleSelectedMarkerFromContext(
  result,
  parameterNames,
  getState
) {
  const feature = extractSingleSelectedFeatureOfTypeFromContext(
    FeatureType.POINTS
  )(getState);

  assign(result, parameterNames, toScaledJSONFromLonLat(feature.points[0]));
}

/**
 * Extracts the selected polygon from the store and assigns its coordinates
 * (both the boundary and any potential holes in it) to the listed variables in
 * the result object.
 */
function extractSingleSelectedPolygonFromContext(
  result,
  parameterNames,
  getState
) {
  const feature = extractSingleSelectedFeatureOfTypeFromContext(
    FeatureType.POLYGON
  )(getState);

  assign(result, parameterNames, {
    points: feature.points.map(toScaledJSONFromLonLat),
    holes: feature.holes.map((hole) => hole.map(toScaledJSONFromLonLat)),
  });
}

/**
 * Extracts a selected coordinate from the store, which belongs to either a UAV
 * or a marker feature on the map.
 */
function extractSelectedCoordinateFromContext(
  result,
  parameterNames,
  getState
) {
  try {
    extractSingleSelectedUAVCoordinateFromContext(
      result,
      parameterNames,
      getState
    );
  } catch {
    try {
      extractSingleSelectedMarkerFromContext(result, parameterNames, getState);
    } catch {
      throw new Error(
        'Exactly one UAV or exactly one marker must be selected!'
      );
    }
  }
}

const contextHandlers = {
  [ParameterUIContext.NET_MISSION_END_RATIO]:
    extractNetMissionEndRatioFromContext,
  [ParameterUIContext.NET_MISSION_START_RATIO]:
    extractNetMissionStartRatioFromContext,
  [ParameterUIContext.SELECTED_COORDINATE]:
    extractSelectedCoordinateFromContext,
  [ParameterUIContext.SELECTED_LINE_STRING_FEATURE]:
    extractSingleSelectedLineStringFromContext,
  [ParameterUIContext.SELECTED_MARKER_FEATURE]:
    extractSingleSelectedMarkerFromContext,
  [ParameterUIContext.SELECTED_POLYGON_FEATURE]:
    extractSingleSelectedPolygonFromContext,
  [ParameterUIContext.SELECTED_UAV_COORDINATE]:
    extractSingleSelectedUAVCoordinateFromContext,
};
