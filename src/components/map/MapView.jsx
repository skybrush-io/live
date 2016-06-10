import React, { PropTypes } from 'react'
import { Map, View, interaction, layer, source } from 'ol-react'
import { connect } from 'react-redux'

import ol from 'openlayers'

import ActiveUAVsLayerSource from './ActiveUAVsLayerSource'
import Flock from '../../model/flock'
import { Tool } from './tools'

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
class MapViewPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.assignActiveUAVsLayerRef_ = this.assignActiveUAVsLayerRef_.bind(this)
    this.dummy_ = this.dummy_.bind(this)
    this.onBoxDragEnded = this.onBoxDragEnded.bind(this)
  }

  dummy_ (ref) {
    this.map_ = ref
  }

  render () {
    const { flock, projection, selectedTool } = this.props
    const center = projection([19.061951, 47.473340])
    const view = <View center={center} zoom={17} />
    return (
      <Map view={view} loadTilesWhileInteracting={true} ref={this.dummy_}>
        <layer.Tile>
          <source.OSM />
        </layer.Tile>
        <layer.Vector>
          <ActiveUAVsLayerSource ref={this.assignActiveUAVsLayerRef_}
                                 flock={flock} projection={projection} />
        </layer.Vector>
        <interaction.Select select={this.onSelect} />
        <interaction.DragBox active={selectedTool === Tool.SELECT} boxend={this.onBoxDragEnded} />

        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.always} />
        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.shiftKeyOnly} out={true} />
      </Map>
    )
  }

  assignActiveUAVsLayerRef_ (ref) {
    this.activeUAVsLayer = ref
  }

  onBoxDragEnded (event) {
    const layer = this.activeUAVsLayer
    if (!layer) {
      return
    }

    const box = event.target
    const extent = box.getGeometry().getExtent()
    layer.source.forEachFeatureInExtent(extent,
      feature => {
        feature.selected = true
      }
    )
  }

  onSelect (event) {
    for (let feature of event.selected) {
      feature.selected = true
    }
    for (let feature of event.deselected) {
      feature.selected = false
    }
  }
}

MapViewPresentation.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func.isRequired,
  selectedTool: PropTypes.string
}

/**
 * Connects the map view to the Redux store.
 */
const MapView = connect(
  // mapStateToProps
  state => ({
    selectedTool: state.map.tools.selectedTool
  })
)(MapViewPresentation)

MapView.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func.isRequired
}

MapView.defaultProps = {
  projection: coordinateFromLonLat
}

export default MapView
