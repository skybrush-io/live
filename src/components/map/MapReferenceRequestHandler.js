/**
 * @file React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */

import ol from 'openlayers'
import React, { PropTypes } from 'react'
import { mapReferenceRequestSignal } from '../../signals'

/**
 * React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */
export default class MapReferenceRequestHandler extends React.Component {
  /**
   * Constructor that adds signal handler.
   *
   * @param {Object} props properties of the react component
   */
  constructor (props) {
    super(props)
    mapReferenceRequestSignal.add(this.onMapReferenceRequested_.bind(this))
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

MapReferenceRequestHandler.contextTypes = {
  map: PropTypes.instanceOf(ol.Map)
}
