import React, { PropTypes } from 'react'
import { Map, View, layer, source } from 'ol-react'
import ol from 'openlayers'

import ActiveUAVsLayerSource from './ActiveUAVsLayerSource'
import Flock from '../../model/flock'

require('openlayers/css/ol.css')

/**
 * Helper function to convert a latitude-longitude pair to the coordinate
 * system used by the map view.
 *
 * Longitudes and latitudes are assumed to be given in WGS-84.
 *
 * @param {Number[]}  coords  the longitude and latitude, in this order
 * @return {Object} the OpenLayers coordinate corresponding to the given
 *         latitude and longitude
 */
const coordinateFromLonLat = coords => (
  // EPSG:3857 is Spherical Mercator projection, as used by most tile-based
  // mapping services
  ol.proj.fromLonLat(coords, 'EPSG:3857')
)

/**
 * React component for the full-bleed map of the main window.
 */
export default class MapView extends React.Component {
  render () {
    const { flock, projection } = this.props
    const center = projection([19.061951, 47.473340])
    const view = <View center={center} zoom={17} />
    return (
      <Map view={view} loadTilesWhileInteracting={true}>
        <layer.Tile>
          <source.OSM />
        </layer.Tile>
        <layer.Vector>
          <ActiveUAVsLayerSource flock={flock} projection={projection} />
        </layer.Vector>
      </Map>
    )
  }
}

MapView.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func.isRequired
}

MapView.defaultProps = {
  projection: coordinateFromLonLat
}
