/**
 * @file Helper functions to create some simple OpenLayers styles.
 */

import Point from 'ol/geom/Point';
import { Fill, RegularShape, Stroke, Style } from 'ol/style';

import { bearing } from './math';

export const primaryColor = '#2196f3'; // Blue[500] in Material-UI

export const fill = (color) => new Fill({ color });
export const stroke = (color, width = 1, lineDash = []) =>
  new Stroke({ color, width, lineDash });

export const thickOutline = (color) => stroke(color, 5);
export const thinOutline = (color) => stroke(color, 2);
export const veryThinOutline = (color) => stroke(color, 1);

export const blackVeryThinOutline = veryThinOutline('black');
export const blackThinOutline = thinOutline('black');
export const blackThickOutline = thickOutline('black');

export const shadowVeryThinOutline = veryThinOutline('rgba(0, 0, 0, 0.6)');
export const shadowThinOutline = thinOutline('rgba(0, 0, 0, 0.6)');
export const shadowThickOutline = thickOutline('rgba(0, 0, 0, 0.6)');

export const whiteVeryThinOutline = veryThinOutline('white');
export const whiteThinOutline = thinOutline('white');
export const whiteThickOutline = thickOutline('white');

export const dashedThickOutline = (color) => stroke(color, 5, [5, 10]);
export const dottedThickOutline = (color) => stroke(color, 5, [1, 10]);
export const dottedThinOutline = (color) => stroke(color, 2, [1, 5]);

/**
 * Creates an OpenLayers Style to display an arrowhead at either the start or
 * the end of a LineString.
 *
 * @param {OpenLayers.Color} color
 * @param {('start'|'end')} side
 *
 * @return {OpenLayers.Style}
 */
export const lineStringArrow = (color, side) => (feature) => {
  const geom = feature.getGeometry();
  const coordinates = geom.getCoordinates();

  if (coordinates.length < 2) {
    // Return an empty style if the linestring doesn't have at least two points.
    return new Style();
  }

  const radius = 10;

  const { displacement, position, rotation } = (() => {
    switch (side) {
      case 'start':
        return {
          displacement: [0, radius * 0.5],
          position: coordinates.at(0),
          rotation: bearing(coordinates.at(0), coordinates.at(1)),
        };

      case 'end':
        return {
          displacement: [0, -radius],
          position: coordinates.at(-1),
          rotation: bearing(coordinates.at(-2), coordinates.at(-1)),
        };

      default:
        throw new Error(`Expected 'start' or 'end', received: ${side}`);
    }
  })();

  return new Style({
    geometry: new Point(position),
    image: new RegularShape({
      points: 3,
      fill: fill(color),
      rotateWithView: true,
      radius,
      scale: [0.75, 1],
      rotation,
      displacement,
    }),
  });
};
