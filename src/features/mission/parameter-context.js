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
  getSingleSelectedFeatureId,
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

export const ParameterUIContext = {
  SELECTED_UAV_COORDINATE: 'selectedUAVCoordinate',
  SELECTED_POLYGON_FEATURE: 'selectedPolygonFeature',
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

  for (const [contextId, parameterNames] of parameterNamesByContext.entries()) {
    const handler = contextHandlers[contextId];

    if (handler && typeof handler === 'function') {
      handler(result, parameterNames, getState);
    }
  }

  console.log(result);

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
 * Extracts the selected UAV from the store and assigns its coordinates to the
 * listed variables in the result object.
 */
function extractSelectedUAVCoordinateFromContext(
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
 * Extracts the selected polygon from the store and assigns its coordinates
 * (both the boundary and any potential holes in it) to the listed variables in
 * the result object.
 */
function extractSelectedPolygonFromContext(result, parameterNames, getState) {
  const state = getState();

  const featureId = getSingleSelectedFeatureId(state);
  if (!featureId) {
    throw new Error('Exactly one polygon must be selected on the map');
  }

  const feature = getFeatureById(state, featureId);
  const featureType = feature?.type;
  if (featureType !== FeatureType.POLYGON) {
    throw new Error(
      `The selected feature on the map must be a polygon, got: ${feature?.type}`
    );
  }

  // Extend the parameters with the coordinates of the selected line string
  // and the coordinates of the selected UAV
  assign(result, parameterNames, {
    points: feature.points.map(toScaledJSONFromLonLat),
    holes: feature.holes.map((hole) => hole.map(toScaledJSONFromLonLat)),
  });
}

const contextHandlers = {
  [ParameterUIContext.SELECTED_UAV_COORDINATE]:
    extractSelectedUAVCoordinateFromContext,
  [ParameterUIContext.SELECTED_POLYGON_FEATURE]:
    extractSelectedPolygonFromContext,
};
