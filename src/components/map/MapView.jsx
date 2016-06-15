import React, { PropTypes } from 'react'
import { Map, View, interaction, layer, source } from 'ol-react'
import { connect } from 'react-redux'

import ol from 'openlayers'

import ActiveUAVsLayerSource from './ActiveUAVsLayerSource'
import SelectNearestFeature from './interactions/SelectNearestFeature'
import { Tool } from './tools'

import { setSelectedFeatures, addSelectedFeatures, removeSelectedFeatures }
       from '../../actions/map'
import Flock from '../../model/flock'
import { Tool } from './tools'
import { Source } from './sources'

import { BingAPI } from 'config'

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
    this.assignActiveUAVsLayerSourceRef_ = this.assignActiveUAVsLayerSourceRef_.bind(this)
    this.isLayerShowingActiveUAVs_ = this.isLayerShowingActiveUAVs_.bind(this)
    this.onBoxDragEnded_ = this.onBoxDragEnded_.bind(this)
    this.onSelect_ = this.onSelect_.bind(this)
  }

  render () {
    const { visibleSource, flock, projection, selectedTool, selection } = this.props
    const center = projection([19.061951, 47.473340])
    const view = <View center={center} zoom={17} />

    return (
      <Map view={view} loadTilesWhileInteracting={true}>
        <layer.Tile visible={visibleSource === Source.OSM}>
          <source.OSM />
        </layer.Tile>
        <layer.Tile visible={visibleSource === Source.BING_MAPS}>
          <source.BingMaps apiKey={BingAPI.key} imagerySet="AerialWithLabels" />
        </layer.Tile>

        <layer.Vector ref={this.assignActiveUAVsLayerRef_}
                      updateWhileAnimating={true} updateWhileInteracting={true}>
          <ActiveUAVsLayerSource ref={this.assignActiveUAVsLayerSourceRef_}
                                 selection={selection}
                                 flock={flock} projection={projection} />
        </layer.Vector>

        <SelectNearestFeature active={selectedTool === Tool.SELECT}
                              addCondition={ol.events.condition.shiftKeyOnly}
                              layers={this.isLayerShowingActiveUAVs_}
                              removeCondition={ol.events.condition.altKeyOnly}
                              toggleCondition={ol.events.condition.platformModifierKeyOnly}
                              select={this.onSelect_}
                              threshold={32} />

        <interaction.DragBox active={selectedTool === Tool.SELECT}
                             boxend={this.onBoxDragEnded_} />

        {/* Ctrl/Cmd + Drag --> Box select features */}
        <interaction.DragBox condition={ol.events.condition.platformModifierKeyOnly} boxend={this.onBoxDragEnded_} />

        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.always} />
        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.shiftKeyOnly} out={true} />
      </Map>
    )
  }

  /**
   * Handler called when the layer showing the active UAVs is monted.
   * is mounted. We use it to store a reference to the component within
   * this component.
   *
   * @param  {layer.Vector} ref  the layer for the active UAVs
   */
  assignActiveUAVsLayerRef_ (ref) {
    this.activeUAVsLayer = ref
  }

  /**
   * Handler called when the layer source containing the list of UAVs
   * is mounted. We use it to store a reference to the component within
   * this component.
   *
   * @param  {ActiveUAVsLayerSource} ref  the layer source for the active UAVs
   */
  assignActiveUAVsLayerSourceRef_ (ref) {
    this.activeUAVsLayerSource = ref
  }

  /**
   * Returns true if the given layer is the layer that shows the active UAVs,
   * false otherwise.
   *
   * @param {ol.Layer} layer  the layer to test
   * @return  whether the given layer is the one that shows the active UAVs
   */
  isLayerShowingActiveUAVs_ (layer) {
    return this.activeUAVsLayer && this.activeUAVsLayer.layer === layer
  }

  /**
   * Event handler that is called when the user finishes the drag-box
   * interaction on the map in "select" mode.
   *
   * @param  {ol.DragBoxEvent} event  the event dispatched by the drag-box
   *         interaction
   */
  onBoxDragEnded_ (event) {
    const layer = this.activeUAVsLayerSource
    if (!layer) {
      return
    }

    const mapBrowserEvent = event.mapBrowserEvent
    let action

    if (ol.events.condition.altKeyOnly(mapBrowserEvent)) {
      action = removeSelectedFeatures
    } else if (ol.events.condition.shiftKeyOnly(mapBrowserEvent)) {
      action = addSelectedFeatures
    } else {
      action = setSelectedFeatures
    }

    const ids = []
    const source = layer.source
    const extent = event.target.getGeometry().getExtent()
    source.forEachFeatureIntersectingExtent(extent, feature => {
      ids.push(feature.getId())
    })

    this.props.dispatch(action(ids))
  }

  /**
   * Event handler that is called when the user selects a UAV on the map
   * by clicking.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         'toggle' or 'set'
   * @param  {ol.Feature}  feature  the selected feature
   * @param  {Number}  distance  the distance of the feature from the point
   *         where the user clicked, in pixels
   */
  onSelect_ (mode, feature, distance) {
    const actionMapping = {
      'add': addSelectedFeatures,
      'remove': removeSelectedFeatures,
      'toggle': feature.selected ? removeSelectedFeatures : addSelectedFeatures
    }
    const action = actionMapping[mode] || setSelectedFeatures
    const id = feature ? feature.getId() : undefined
    if (id) {
      this.props.dispatch(action([id]))
    }
  }
}

MapViewPresentation.propTypes = {
  visibleSource: PropTypes.string,
  flock: PropTypes.instanceOf(Flock),
  projection: PropTypes.func.isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedTool: PropTypes.string,
  dispatch: PropTypes.func.isRequired
}

/**
 * Connects the map view to the Redux store.
 */
const MapView = connect(
  // mapStateToProps
  state => ({
    visibleSource: state.map.sources.visibleSource,
    selectedTool: state.map.tools.selectedTool,
    selection: state.map.selection
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
