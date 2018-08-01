/**
 * @file Helper functions to create some simple OpenLayers styles.
 */

import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'

export const primaryColor = '#2196f3' // blue[500] in Material-UI

export const fill = (color) => new Fill({ color })
export const stroke = (color, width = 1) => new Stroke({ color, width })
export const thickOutline = (color) => stroke(color, 5)
export const thinOutline = (color) => stroke(color, 2)

export const whiteThinOutline = thinOutline('white')
export const whiteThickOutline = thickOutline('white')
