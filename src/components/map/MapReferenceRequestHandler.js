/**
 * @file React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */

import ol from 'openlayers'
import React, { PropTypes } from 'react'
import Signal from 'mini-signals'

/**
 * React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 *
 * @param {Object} props properties of the react component
 * @property {Signal} mapReferenceRequestSignal Mini-signal for requesting the map reference
 */
export default class MapReferenceRequestHandler extends React.Component {
  /**
   * Request signal generator function.
   *
   * @return {Signal} Mini-signal for requesting the map reference.
   */
  static generateRequestSignal () {
    return new Signal()
  }

  /**
   * Constructor that adds signal handler.
   *
   * @param {Object} props properties of the react component
   * @property {Signal} mapReferenceRequestSignal Mini-signal for requesting the map reference
   */
  constructor (props) {
    super(props)
    props.mapReferenceRequestSignal.add(this.onMapReferenceRequested_.bind(this))
  }

  render () {
    return false
  }

  /**
   * Event handler processing the map reference requests.
   * Calls the supplied callback with the map reference.
   *
   * @listens {mapReferenceRequestSignal} listens for map references being requested.
   *
   * @param {function} callback the callback sent by the component requesting the reference
   */
  onMapReferenceRequested_ (callback) {
    callback(this.context.map)
  }
}

MapReferenceRequestHandler.propTypes = {
  mapReferenceRequestSignal: PropTypes.instanceOf(Signal)
}

MapReferenceRequestHandler.contextTypes = {
  map: PropTypes.instanceOf(ol.Map)
}
