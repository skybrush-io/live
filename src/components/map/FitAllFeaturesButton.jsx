/**
* @file React Component to display and adjust the rotation of the map view.
*/

import React from 'react'
import ol from 'openlayers'

import Signal from 'mini-signals'

import IconButton from 'material-ui/IconButton'
import DeviceGpsFixed from 'material-ui/svg-icons/device/gps-fixed'

/**
 * React Component to adjust the view so that it fits all of the current features.
 *
 * @param {Object} props properties of the react component
 * @property {Signal} mapReferenceRequestSignal Mini-signal for requesting
 * the map reference.
 * @property {number} margin amount of margin to leave between the features
 * and the border of the view
 * @property {number} duration the amount of time the transition should take (in ms)
 *
 * @emits {mapReferenceRequestSignal} requests map reference.
 */
export default class FitAllFeaturesButton extends React.Component {
  /**
   * Constructor that binds context to functions,
   * and requests map reference with callback.
   *
   * @param {Object} props properties of the react component
   * @property {Signal} mapReferenceRequestSignal Mini-signal for requesting
   * the map reference.
   * @property {number} margin amount of margin to leave between the features
   * and the border of the view
   * @property {number} duration the amount of time the transition should take (in ms)
   *
   * @emits {mapReferenceRequestSignal} requests map reference.
   */
  constructor (props) {
    super(props)

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    props.mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <IconButton onClick={this.handleClick_} tooltip="Fit all features">
        <DeviceGpsFixed />
      </IconButton>
    )
  }

  /**
  * Callback for receiving the map reference and saving it.
  *
  * @param {ol.Map} map the map to attach the event handlers to
  */
  onMapReferenceReceived_ (map) {
    this.map = map
  }

  /**
  * Event handler that calculates the target extent and fits it into the view
  *
  * @param {Event} e the event fired from the IconButton component
  */
  handleClick_ (e) {
    const view = this.map.getView()

    let feasibleLayers = this.map.getLayers().getArray().filter(this.isLayerFeasible_)
    let featureArrays = feasibleLayers.map(l => l.getSource().getFeatures())
    let features = [].concat.apply([], featureArrays)
    let featurePositions = features.map(f => f.getGeometry().getCoordinates())

    let extent = ol.extent.boundingExtent(featurePositions)

    extent = ol.extent.buffer(extent, this.props.margin)

    this.map.beforeRender(ol.animation.zoom({
      resolution: view.getResolution(),
      duration: this.props.duration,
      easing: ol.easing.easeOut
    }))
    this.map.beforeRender(ol.animation.pan({
      source: view.getCenter(),
      duration: this.props.duration,
      easing: ol.easing.easeOut
    }))

    // this.map.beforeRender(ol.animation.rotate({
    //   rotation: view.getRotation(),
    //   duration: this.props.duration,
    //   easing: ol.easing.easeOut
    // }))
    //
    // view.setRotation(0)

    view.fit(extent, this.map.getSize())
  }

  /**
   * Returns whether a given layer is visible and has an associated vector
   * source.
   *
   * @param {ol.layer.Layer} layer  the layer to test
   * @return {boolean} whether the layer is visible and has an associated
   *         vector source
   */
  isLayerFeasible_ (layer) {
    return layer && layer.getVisible() && layer instanceof ol.layer.Vector
  }
}

FitAllFeaturesButton.propTypes = {
  duration: React.PropTypes.number,
  margin: React.PropTypes.number,
  mapReferenceRequestSignal: React.PropTypes.instanceOf(Signal)
}
