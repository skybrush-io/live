/**
 * @file React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */

import Map from 'ol/Map';
import PropTypes from 'prop-types';
import React from 'react';

import { withMap } from '@collmot/ol-react';

import { mapReferenceRequestSignal } from '~/signals';

/**
 * React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */
class MapReferenceRequestHandler extends React.Component {
  static propTypes = {
    map: PropTypes.instanceOf(Map),
  };

  /**
   * Constructor that adds signal handler.
   *
   * @param {Object} props properties of the react component
   */
  constructor(props) {
    super(props);
    mapReferenceRequestSignal.add(this._onMapReferenceRequested.bind(this));
  }

  render() {
    return false;
  }

  /**
   * Event handler processing the map reference requests.
   * Calls the supplied callback with the map reference.
   *
   * @listens {mapReferenceRequestSignal} listens for map references being requested.
   *
   * @param {function} callback the callback sent by the component requesting the reference
   */
  _onMapReferenceRequested(callback) {
    callback(this.props.map);
  }
}

export default withMap(MapReferenceRequestHandler);
