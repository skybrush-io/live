/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

import _ from 'lodash'
import PropTypes from 'prop-types'
import { source } from 'ol-react'

import FeatureManager from '../FeatureManager'
import UAVFeature from '../features/UAVFeature'

import Flock from '../../../model/flock'
import { uavIdToGlobalId } from '../../../model/identifiers'
import { updateUAVFeatureColorsSignal } from '../../../signals'

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

    this._onFeatureAdded = this._onFeatureAdded.bind(this)
    this._onSelectionMaybeChanged = this._onSelectionMaybeChanged.bind(this)
    this._onUAVsUpdated = this._onUAVsUpdated.bind(this)

    this.featureManager = new FeatureManager(this.source)
    this.featureManager.featureFactory = (id, geom) => (new UAVFeature(id, geom))
    this.featureManager.featureIdFunction = uavIdToGlobalId
    this.featureManager.featureAdded.add(this._onFeatureAdded)

    updateUAVFeatureColorsSignal.add(() => {
      const features = this.featureManager.getFeatureArray()
      for (const feature of features) {
        // TODO: we are using a private API here. This is not nice.
        feature._setupStyle()
      }
    })

    this.eventBindings = {}
  }

  componentWillReceiveProps (newProps) {
    this._onFlockMaybeChanged(this.props.flock, newProps.flock)
    this._onSelectionMaybeChanged(this.props.selection, newProps.selection)
    this.featureManager.projection = newProps.projection
  }

  componentDidMount () {
    super.componentDidMount()

    this.context.layer.set('selectable', true)

    this._onFlockMaybeChanged(undefined, this.props.flock)
    this._onSelectionMaybeChanged(undefined, this.props.selection)

    this.featureManager.projection = this.props.projection
  }

  componentWillUnmount () {
    this._onFlockMaybeChanged(this.props.flock, undefined)
    this._onSelectionMaybeChanged(this.props.selection, undefined)
    this.featureManager.projection = undefined
    // no componentWillUnmount() in superclass so we don't call it
  }

  /**
   * Event handler that is called when a new feature was added by the feature
   * manager. This happens when we see a new UAV for the first time.
   *
   * @param {UAVFeature}  feature  the feature that was added
   */
  _onFeatureAdded (feature) {
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
   * Function that is called when we suspect that the set of selected UAVs
   * may have changed.
   *
   * @param {string[]}  oldSelection  the old selection of UAVs
   * @param {string[]}  newSelection  the new selection of UAVs
   */
  _onSelectionMaybeChanged (oldSelection, newSelection) {
    const getFeatureById = this.source.getFeatureById.bind(this.source)
    _(newSelection).difference(oldSelection).map(getFeatureById).filter().each(
      feature => { feature.selected = true }
    )
    _(oldSelection).difference(newSelection).map(getFeatureById).filter().each(
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
  _onUAVsUpdated (uavs) {
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
