/**
 * @file Helper functions to create some simple OpenLayers styles.
 */

import type { Color } from 'ol/color';
import type { ColorLike } from 'ol/colorlike';
import type Feature from 'ol/Feature';
import type LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Fill, RegularShape, Stroke, Style } from 'ol/style';

import { bearing, type Coordinate2D } from './math';

export const primaryColor = '#2196f3'; // Blue[500] in Material-UI

export const fill = (color: Color | ColorLike): Fill => new Fill({ color });
export const stroke = (
  color: Color | ColorLike,
  width: number | undefined = 1,
  lineDash: number[] | undefined = []
): Stroke => new Stroke({ color, width, lineDash });

export const thickOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 5);
export const thinOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 2);
export const veryThinOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 1);

export const blackVeryThinOutline = veryThinOutline('black');
export const blackThinOutline = thinOutline('black');
export const blackThickOutline = thickOutline('black');

export const shadowVeryThinOutline = veryThinOutline('rgba(0, 0, 0, 0.6)');
export const shadowThinOutline = thinOutline('rgba(0, 0, 0, 0.6)');
export const shadowThickOutline = thickOutline('rgba(0, 0, 0, 0.6)');

export const whiteVeryThinOutline = veryThinOutline('white');
export const whiteThinOutline = thinOutline('white');
export const whiteThickOutline = thickOutline('white');

export const dashedThickOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 5, [5, 10]);
export const dottedThickOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 5, [1, 10]);
export const dottedThinOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 2, [1, 5]);

/**
 * Creates an OpenLayers Style to display an arrowhead at either the start or
 * the end of a LineString.
 */
export function lineStringArrow(
  color: Color | ColorLike,
  side: 'start' | 'end'
) {
  return (feature: Feature<LineString>): Style => {
    const geom = feature.getGeometry();
    const coordinates = geom?.getCoordinates();

    if (!coordinates || coordinates.length < 2) {
      // Return an empty style if the linestring doesn't have at least two points.
      return new Style();
    }

    const radius = 10;

    const { displacement, position, rotation } = (() => {
      switch (side) {
        case 'start':
          return {
            displacement: [0, radius * 0.5],
            position: coordinates.at(0) as Coordinate2D,
            rotation: bearing(
              coordinates.at(0) as Coordinate2D,
              coordinates.at(1) as Coordinate2D
            ),
          };

        case 'end':
          return {
            displacement: [0, -radius],
            position: coordinates.at(-1) as Coordinate2D,
            rotation: bearing(
              coordinates.at(-2) as Coordinate2D,
              coordinates.at(-1) as Coordinate2D
            ),
          };

        default:
          throw new Error(
            `Expected 'start' or 'end', received: ${String(side)}`
          );
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
}
