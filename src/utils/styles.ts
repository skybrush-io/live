/**
 * @file Helper functions to create some simple OpenLayers styles.
 */

import type { Color } from 'ol/color';
import type { ColorLike } from 'ol/colorlike';
import { Fill, Stroke } from 'ol/style';

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
export const dottedThinOutline = (color: Color | ColorLike): Stroke =>
  stroke(color, 2, [1, 5]);
