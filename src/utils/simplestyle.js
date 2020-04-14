/**
 * @file MapBox SimpleStyle support
 */

import Color from 'color';
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';

/**
 * @private
 * Mapping from MapBox marker size constants to the corresponding marker sizes
 * in pixels.
 */
const _markerSizeToRadius = {
  small: 10,
  medium: 15,
  large: 20,
};

/**
 * Converts a MapBox SimpleStyle style specification to a corresponding
 * OpenLayers style object.
 *
 * @param  {Object} style the MapBox SimpleStyle specification to convert
 * @param  {Object} defaults  default values to use for the generated OpenLayers
 *         style if the MapBox style specification does not specify the
 *         corresponding value
 * @return {ol.style.Style}  an OpenLayers style object corresponding to the
 *         MapBox style specification
 */
export function convertSimpleStyleToOLStyle(style, defaults) {
  const realStyle = {
    'fill-opacity': 0.6,
    'stroke-opacity': 1,
    'stroke-width': 2,
    ...defaults,
    ...style,
  };
  const hasStroke = realStyle.stroke !== undefined;
  const hasFill = realStyle.fill !== undefined;
  const hasText = realStyle.title !== undefined;
  const hasMarker =
    realStyle['marker-size'] ||
    realStyle['marker-symbol'] ||
    realStyle['marker-color'];

  const strokeColor = hasStroke
    ? Color(realStyle.stroke || '#555555').alpha(realStyle['stroke-opacity'])
    : undefined;
  const fillColor = hasFill
    ? Color(realStyle.fill || '#555555').alpha(realStyle['fill-opacity'])
    : undefined;
  const { title } = realStyle;
  const styleProps = {};
  let markerSizeInPixels = 0;

  if (strokeColor) {
    styleProps.stroke = new Stroke({
      color: strokeColor.array(),
      width: Number(realStyle['stroke-width']),
    });
  }

  if (fillColor) {
    styleProps.fill = new Fill({
      color: fillColor.array(),
    });
  }

  if (hasMarker) {
    const markerColor = Color(realStyle['marker-color'] || '#7e7e7e');
    const markerSize = realStyle['marker-size'] || 'medium';
    markerSizeInPixels =
      _markerSizeToRadius[markerSize] !== undefined
        ? _markerSizeToRadius[markerSize]
        : _markerSizeToRadius.medium;
    styleProps.image = new Circle({
      fill: new Fill({
        color: markerColor.array(),
      }),
      stroke: new Stroke({
        color: markerColor.blacken(0.5),
      }),
      radius: markerSizeInPixels / 2,
    });
  }

  if (hasText) {
    styleProps.text = new Text({
      text: title,
      font: 'normal 14px Arial',
      fill: new Fill({
        color: '#ffffff',
      }),
      stroke: new Stroke({
        color: '#000000',
        width: 2,
      }),
    });
  }

  // Offset the text with the marker size if needed
  if (hasText && markerSizeInPixels > 0) {
    styleProps.text.setOffsetY(markerSizeInPixels + 2);
  }

  return new Style(styleProps);
}
