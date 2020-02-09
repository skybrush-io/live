/**
 * @file Helper functions to create some simple OpenLayers styles.
 */

import { Fill, Stroke } from 'ol/style';

export const primaryColor = '#2196f3'; // Blue[500] in Material-UI

export const fill = color => new Fill({ color });
export const stroke = (color, width = 1) => new Stroke({ color, width });

export const thickOutline = color => stroke(color, 5);
export const thinOutline = color => stroke(color, 2);
export const veryThinOutline = color => stroke(color, 1);

export const blackVeryThinOutline = veryThinOutline('black');
export const blackThinOutline = thinOutline('black');
export const blackThickOutline = thickOutline('black');

export const shadowVeryThinOutline = veryThinOutline('rgba(0, 0, 0, 0.6)');
export const shadowThinOutline = thinOutline('rgba(0, 0, 0, 0.6)');
export const shadowThickOutline = thickOutline('rgba(0, 0, 0, 0.6)');

export const whiteVeryThinOutline = veryThinOutline('white');
export const whiteThinOutline = thinOutline('white');
export const whiteThickOutline = thickOutline('white');
