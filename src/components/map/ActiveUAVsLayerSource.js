/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

import _ from 'lodash'
import { PropTypes } from 'react'
import { source } from 'ol-react'

import FeatureManager from './FeatureManager'
import Flock from '../../model/flock'
import UAVFeature from './features/UAVFeature'

/**
 * OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 *
 * This layer source can be passed to an OpenLayers layer as a source to
 * show all the active UAVs on top of the map.
 */
export default class ActiveUAVsLayerSource extends source.Vector {
  constructor (props) {
    super(props)

    this.featureManager = new FeatureManager(this.source)
    this.featureManager.featureFactory = (id, geom) => (new UAVFeature(id, geom))
    this.eventBindings = {}

    this.onUAVsUpdated_ = this.onUAVsUpdated_.bind(this)
  }

  componentWillReceiveProps (newProps) {
    super.componentWillReceiveProps()
    this.onFlockMaybeChanged_(this.props.flock, newProps.flock)
    this.featureManager.projection = newProps.projection
  }

  componentDidMount () {
    super.componentDidMount()
    this.onFlockMaybeChanged_(undefined, this.props.flock)
    this.featureManager.projection = this.props.projection
  }

  componentWillUnmount () {
    this.onFlockMaybeChanged_(this.props.flock, undefined)
    this.featureManager.projection = undefined
    super.componentWillUnmount()
  }

  /**
   * Function that is called when we suspect that the flock associated to
   * the layer may have changed.
   *
   * This function subscribes to the events from the new flock and
   * unsubscribes from the events of the old flock. It also performs a
   * strict equality check on the two flocks because they may be equal.
   *
   * @param {Flock} oldFlock  the old flock associated to the layer
   * @param {Flock} newFlock  the new flock associated to the layer
   */
  onFlockMaybeChanged_ (oldFlock, newFlock) {
    if (oldFlock === newFlock) {
      return
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this.eventBindings.uavsUpdated)
      delete this.eventBindings.uavsUpdated
    }

    if (newFlock) {
      this.eventBindings.uavsUpdated = newFlock.uavsUpdated.add(this.onUAVsUpdated_)
    }
  }

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and the layer should be re-drawn.
   *
   * @listens Flock#uavsUpdated
   * @param {UAV[]} uavs  the UAVs that should be refreshed
   */
  onUAVsUpdated_ (uavs) {
    _.each(uavs, uav => {
      const feature = this.featureManager.createOrUpdateFeatureById(
        uav.id, [uav.lon, uav.lat]
      )

      // Here we assume that the feature was created by _createStyleForUAV
      // so its first style object is the icon
      if (typeof uav.heading !== 'undefined') {
        feature.heading = uav.heading
      }
    })
  }
}

ActiveUAVsLayerSource.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func
}
