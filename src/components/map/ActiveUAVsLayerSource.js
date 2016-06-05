/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

import _ from 'lodash'
import ol from 'openlayers'
import { PropTypes } from 'react'
import { source } from 'ol-react'

import FeatureManager from './FeatureManager'
import Flock from '../../model/flock'

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

    this._createStyleForUAV = this._createStyleForUAV.bind(this)

    this.featureManager = new FeatureManager(this.source)
    this.featureManager.styleFactory = this._createStyleForUAV
    this.eventBindings = {}

    this._onUAVsUpdated = this._onUAVsUpdated.bind(this)
  }

  componentWillReceiveProps (newProps) {
    super.componentWillReceiveProps()
    this._onFlockMaybeChanged(this.props.flock, newProps.flock)
    this.featureManager.projection = newProps.projection
  }

  componentDidMount () {
    super.componentDidMount()
    this._onFlockMaybeChanged(undefined, this.props.flock)
    this.featureManager.projection = this.props.projection
  }

  componentWillUnmount () {
    this._onFlockMaybeChanged(this.props.flock, undefined)
    this.featureManager.projection = undefined
    super.componentWillUnmount()
  }

  /**
   * Creates a new style for the UAV with the given ID.
   *
   * @param {string} id  the UAV for which the feature has to be
   *        created
   * @return {Array<ol.style.Style>} the style for the UAV with the
   *         given ID
   */
  _createStyleForUAV (id) {
    return [
      new ol.style.Style({
        image: new ol.style.Icon(({
          rotateWithView: true,
          rotation: 45 * Math.PI / 180,
          snapToPixel: false,
          src: ['/assets/drone.32x32.red.png']
        }))
      }),
      new ol.style.Style({
        text: new ol.style.Text({
          font: '12px sans-serif',
          offsetY: 24,
          text: id || 'undefined',
          textAlign: 'center'
        })
      })
    ]
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
  _onFlockMaybeChanged (oldFlock, newFlock) {
    if (oldFlock === newFlock) {
      return
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this.eventBindings.uavsUpdated)
      delete this.eventBindings.uavsUpdated
    }

    if (newFlock) {
      this.eventBindings.uavsUpdated = newFlock.uavsUpdated.add(this._onUAVsUpdated)
    }
  }

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and the layer should be re-drawn.
   *
   * @listens Flock#uavsUpdated
   * @param {UAV[]} uavs  the UAVs that should be refreshed
   */
  _onUAVsUpdated (uavs) {
    _.each(uavs, uav => {
      this.featureManager.createOrUpdateFeatureById(uav.id, [uav.lon, uav.lat])
    })
  }
}

ActiveUAVsLayerSource.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func
}
