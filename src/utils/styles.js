/**
 * @file Helper functions to create some simple OpenLayers styles.
 */

import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'

export const fill = (color) => new Fill({ color })
export const thickOutline = (color) => new Stroke({ color, width: 5 })
export const thinOutline = (color) => new Stroke({ color, width: 2 })
