/**
 * @file Constants and routines related to the main tools that the user
 * can use on the map.
 */

/**
 * Enum containing constants for the tools that the user can use on the map.
 */
export const Tool = {
  SELECT: 'select',
  ZOOM: 'zoom',
  PAN: 'pan',

  DRAW_POINT: 'drawPoint',
  DRAW_CIRCLE: 'drawCircle',
  DRAW_PATH: 'drawPath',
  DRAW_POLYGON: 'drawPolygon',

  EDIT_FEATURE: 'editFeature'
}

/**
 * Returns whether the given tool identifier represents a drawing tool.
 *
 * @param  {string}  tool the tool identifier
 * @return {boolean} whether the given tool identifier is a drawing tool
 */
export function isDrawingTool (tool) {
  return tool && tool.substr(0, 4) === 'draw'
}

/**
 * Returns the OpenLayers draw interaction type corresponding to the given
 * drawing tool.
 *
 * @param  {string}  tool the tool identifier
 * @return {string}  the OpenLayers interaction type corresponding to the tool
 */
export function toolToDrawInteractionType (tool) {
  switch (tool) {
    case Tool.DRAW_POINT:
      return 'Point'

    case Tool.DRAW_CIRCLE:
      return 'Circle'

    case Tool.DRAW_PATH:
      return 'LineString'

    case Tool.DRAW_POLYGON:
      return 'Polygon'

    default:
      return undefined
  }
}
