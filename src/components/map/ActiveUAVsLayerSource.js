/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

import { source } from 'ol-react'

import FeatureManager from './FeatureManager'

/**
 * OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 *
 * This layer source can be passed to an OpenLayers layer as a source to
 * show all the active UAVs on top of the map.
 */
export default class ActiveUAVsLayerSource extends source.Vector {
  constructor () {
    super()
    this.featureManager = new FeatureManager(this)
  }
}
