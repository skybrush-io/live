import React from 'react'
import { Map, View, layer, source } from 'ol-react'
import ol from 'openlayers'

import ActiveUAVsLayerSource from './ActiveUAVsLayerSource'

require('openlayers/css/ol.css')

/**
 * Helper function to convert a latitude-longitude pair to the coordinate
 * system used by the map view.
 *
 * Longitudes and latitudes are assumed to be given in WGS-84.
 *
 * @param {Number} lat  the latitude
 * @param {Number} lon  the longitude
 * @return {Object} the OpenLayers coordinate corresponding to the given
 *         latitude and longitude
 */
const coordinateFromLatLon = (lat, lon) => (
  // EPSG:3857 is Spherical Mercator projection, as used by most tile-based
  // mapping services
  ol.proj.fromLonLat([lon, lat], 'EPSG:3857')
)

/**
 * React component for the full-bleed map of the main window.
 */
export default class MapView extends React.Component {
  render () {
    const center = coordinateFromLatLon(47.473340, 19.061951)
    const view = <View center={center} zoom={17} />
    return (
      <Map view={view} loadTilesWhileInteracting={true}>
        <layer.Tile>
          <source.OSM />
        </layer.Tile>
        <layer.Vector><ActiveUAVsLayerSource /></layer.Vector>
      </Map>
    )
  }
}
