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

  // TODO(ntamas)
  console.log(result);

  return result;
}
