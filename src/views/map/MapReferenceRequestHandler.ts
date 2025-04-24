/**
 * @file React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */

import Map from 'ol/Map';
import React from 'react';

// @ts-expect-error
import { withMap } from '@collmot/ol-react';

import { mapReferenceRequestSignal } from '~/signals';

/**
 * React Component for sending reference of the map object to
 * other components that request it through mini-signals.
 */
class MapReferenceRequestHandler extends React.Component<{ map: Map }> {
  /**
   * Constructor that adds signal handler.
   */
  constructor(props: { map: Map }) {
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
   * @param callback the callback sent by the component requesting the reference
   */
  _onMapReferenceRequested(callback: (map: Map) => void) {
    callback(this.props.map);
  }
}

export default withMap(MapReferenceRequestHandler) as React.Component<{}>;
