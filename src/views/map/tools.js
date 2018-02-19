/**
 * @file Constants and routines related to the main tools that the user
 * can use on the map.
 */

import { createRotatedBoxGeometryFunction } from '../../utils/geography'

/**
 * Enum containing constants for the tools that the user can use on the map.
 */
export const Tool = {
  SELECT: 'select',
  ZOOM: 'zoom',
  PAN: 'pan',

  DRAW_POINT: 'drawPoint',
  DRAW_CIRCLE: 'drawCircle',
  DRAW_RECTANGLE: 'drawRectangle',
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
 * Returns the OpenLayers draw interaction props corresponding to the given
 * drawing tool.
 *
 * @param  {string}  tool the tool identifier
 * @param  {ol.Map}  map  the map on which the tool will be drawing
 * @return {Object}  the OpenLayers interaction props corresponding to the tool
 */
export function toolToDrawInteractionProps (tool, map) {
  switch (tool) {
    case Tool.DRAW_POINT:
      return {
        type: 'Point'
      }

    case Tool.DRAW_CIRCLE:
      return {
        type: 'Circle'
      }

    case Tool.DRAW_RECTANGLE:
      return {
        geometryFunction: createRotatedBoxGeometryFunction(
          () => map ? -map.getView().getRotation() : 0
        ),
        type: 'Circle'
      }

    case Tool.DRAW_PATH:
      return {
        type: 'LineString'
      }

    case Tool.DRAW_POLYGON:
      return {
        type: 'Polygon'
      }

    default:
      return {
        type: 'Point'
      }
  }
}
