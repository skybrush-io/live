/**
 * @file React Component for sending reference of the map object to
 * other components that request it througn mini-signals.
 */

import ol from 'openlayers'
import React from 'react'
import Signal from 'mini-signals'

export default class MapReferenceRequestHandler extends React.Component {
  /**
   * Constructor.
   *
   * @return {Object} Object containing signals for requesting
   * and sending map references.
   * @property {Signal} mapReferenceRequest mini-signal for requesting a map reference
   * @property {Signal} mapReferenceResponse mini-signal for sending a map reference
   */
  static generateSignals () {
    return {
      mapReferenceRequest: new Signal(),
      mapReferenceResponse: new Signal()
    }
  }

  /**
   * Constructor that adds signal handler.
   *
   * @param {Object} props properties of the react tomponent
   * @property {Object} mapReferenceSignals Object containing signals for requesting
   * and sending map references.
   */
  constructor (props) {
    super(props)
    const {mapReferenceSignals} = props
    mapReferenceSignals.mapReferenceRequest.add(this.onMapReferenceRequested_.bind(this))
    this.responseSignal = mapReferenceSignals.mapReferenceResponse
  }

  render () {
    return false
  }

  /**
   * Event handler for receiving the map reference.
   * Attaches event handlers to the map and it's view.
   *
   * @listens {mapReferenceRequest} listens for map references being sent.
   * @emits {mapReferenceResponse} sends the requested map reference.
   */
  onMapReferenceRequested_ () {
    this.responseSignal.dispatch(this.context.map)
  }
}

MapReferenceRequestHandler.contextTypes = {
  map: React.PropTypes.instanceOf(ol.Map)
}
