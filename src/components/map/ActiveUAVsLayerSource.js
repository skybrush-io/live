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

    this.onFeatureAdded_ = this.onFeatureAdded_.bind(this)
    this.onSelectionMaybeChanged_ = this.onSelectionMaybeChanged_.bind(this)
    this.onUAVsUpdated_ = this.onUAVsUpdated_.bind(this)

    this.featureManager = new FeatureManager(this.source)
    this.featureManager.featureFactory = (id, geom) => (new UAVFeature(id, geom))
    this.featureManager.featureAdded.add(this.onFeatureAdded_)

    this.eventBindings = {}
  }

  componentWillReceiveProps (newProps) {
    this.onFlockMaybeChanged_(this.props.flock, newProps.flock)
    this.onSelectionMaybeChanged_(this.props.selection, newProps.selection)
    this.featureManager.projection = newProps.projection
  }

  componentDidMount () {
    super.componentDidMount()
    this.onFlockMaybeChanged_(undefined, this.props.flock)
    this.onSelectionMaybeChanged_(undefined, this.props.selection)
    this.featureManager.projection = this.props.projection
  }

  componentWillUnmount () {
    this.onFlockMaybeChanged_(this.props.flock, undefined)
    this.onSelectionMaybeChanged_(this.props.selection, undefined)
    this.featureManager.projection = undefined
    super.componentWillUnmount()
  }

  /**
   * Event handler that is called when a new feature was added by the feature
   * manager. This happens when we see a new UAV for the first time.
   *
   * @param {UAVFeature}  feature  the feature that was added
   */
  onFeatureAdded_ (feature) {
    // Ensure that the feature is selected automatically if it is part
    // of the current selection
    feature.selected = _.includes(this.props.selection, feature.getId())
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
   * Function that is called when we suspect that the set of selected UAVs
   * may have changed.
   *
   * @param {string[]}  oldSelection  the old selection of UAVs
   * @param {string[]}  newSelection  the new selection of UAVs
   */
  onSelectionMaybeChanged_ (oldSelection, newSelection) {
    const getFeatures = this.featureManager.getFeatureById.bind(this.featureManager)
    _(newSelection).difference(oldSelection).map(getFeatures).filter().each(
      feature => { feature.selected = true }
    )
    _(oldSelection).difference(newSelection).map(getFeatures).filter().each(
      feature => { feature.selected = false }
    )
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

      // Set or update the heading of the feature
      if (typeof uav.heading !== 'undefined') {
        feature.heading = uav.heading
      }
    })
  }
}

ActiveUAVsLayerSource.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired
}
