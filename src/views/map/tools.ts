/**
 * @file Constants and routines related to the main tools that the user
 * can use on the map.
 */

import { type Options as DrawInteractionProps } from 'ol/interaction/Draw';
import type Map from 'ol/Map';

import { createRotatedBoxGeometryFunction } from '~/utils/geography';

/**
 * Enum containing constants for the tools that the user can use on the map.
 */
export enum Tool {
  SELECT = 'select',
  ZOOM = 'zoom',
  PAN = 'pan',

  DRAW_POINT = 'drawPoint',
  DRAW_CIRCLE = 'drawCircle',
  DRAW_RECTANGLE = 'drawRectangle',
  DRAW_PATH = 'drawPath',
  DRAW_POLYGON = 'drawPolygon',

  CUT_HOLE = 'cutHole',
  EDIT_FEATURE = 'editFeature',
}

/**
 * Returns whether the given tool identifier represents a drawing tool.
 *
 * @param tool - The tool identifier
 * @returns Whether the given tool identifier is a drawing tool
 */
export function isDrawingTool(tool: Tool): boolean {
  // TODO: Remove conditional chaining when the
  //       calling locations ensure proper input.
  return tool?.startsWith('draw');
}

/**
 * Returns the OpenLayers draw interaction props corresponding to the given
 * drawing tool.
 *
 * @param tool - The tool identifier
 * @param map - The map on which the tool will be drawing
 * @returns The OpenLayers interaction props corresponding to the tool
 */
export function toolToDrawInteractionProps(
  tool: Tool,
  map: Map
): DrawInteractionProps {
  switch (tool) {
    case Tool.DRAW_POINT:
      return {
        type: 'Point',
      };

    case Tool.DRAW_CIRCLE:
      return {
        type: 'Circle',
      };

    case Tool.DRAW_RECTANGLE:
      return {
        geometryFunction: createRotatedBoxGeometryFunction(() =>
          map ? -map.getView().getRotation() : 0
        ),
        type: 'Circle',
      };

    case Tool.DRAW_PATH:
      return {
        type: 'LineString',
      };

    case Tool.DRAW_POLYGON:
      return {
        type: 'Polygon',
      };

    default:
      return {
        type: 'Point',
      };
  }
}
