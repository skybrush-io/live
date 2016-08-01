import _ from 'lodash'
import React, { PropTypes } from 'react'
import { Map, View, control, interaction, layer } from 'ol-react'
import { connect } from 'react-redux'

import ol from 'openlayers'
import Condition from './conditions.js'

import { Layers, stateObjectToLayer } from './layers/index.js'

import MapReferenceRequestHandler from './MapReferenceRequestHandler'

import OwnLocation from './OwnLocation'
import SelectNearestFeature from './interactions/SelectNearestFeature'

import { Tool } from './tools'

import { setSelectedFeatures, addSelectedFeatures,
         clearSelectedFeatures, removeSelectedFeatures }
       from '../../actions/map'

require('openlayers/css/ol.css')

/**
 * Helper function to convert a latitude-longitude pair to the coordinate
 * system used by the map view.
 *
 * Longitudes and latitudes are assumed to be given in WGS-84.
 *
 * @param {number[]}  coords  the longitude and latitude, in this order
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

  getChildContext () {
    return {
      assignActiveUAVsLayerRef_: this.assignActiveUAVsLayerRef_,
      assignActiveUAVsLayerSourceRef_: this.assignActiveUAVsLayerSourceRef_
    }
  }

  render () {
    const { projection, selectedTool, ownLocationVisible } = this.props
    const center = projection([19.061951, 47.473340])
    const view = <View center={center} zoom={17} />

    const cursorStyles = {}
    cursorStyles[Tool.SELECT] = 'crosshair'
    cursorStyles[Tool.ZOOM] = 'zoom-in'
    cursorStyles[Tool.PAN] = 'all-scroll'

    const layers = []
    for (const id of this.props.layerOrder) {
      if (id in Layers) {
        layers.push(stateObjectToLayer(this.props.layersById[id], id))
      }
    }

    return (
      <Map view={view} useDefaultControls={false} loadTilesWhileInteracting={true}
        focusOnMount={true}
        style={{cursor: cursorStyles[selectedTool]}} >
        <MapReferenceRequestHandler />

        <div>
          {layers}
        </div>

        <layer.Vector visible={ownLocationVisible}
          updateWhileAnimating={true}
          updateWhileInteracting={true}>
          <OwnLocation />
        </layer.Vector>

        <control.FullScreen source={document.body} />

        <control.MousePosition projection="EPSG:4326"
          coordinateFormat={function (c) {
            return ol.coordinate.format(c, '{y}, {x}', 6)
          }}/>

        <control.ScaleLine minWidth={128} />
        <control.Zoom />

        <div id="heatmapScale" style={{display: 'none'}}>
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>

        {/* PAN mode | Ctrl/Cmd + Drag --> Box select features */}
        <interaction.DragBox active={selectedTool === Tool.PAN}
          condition={ol.events.condition.platformModifierKeyOnly}
          boxend={this.onBoxDragEnded_} />

        <interaction.DragRotate
          condition={ol.events.condition.altShiftKeysOnly} />

        <interaction.DragRotateAndZoom
          condition={Condition.altShiftKeyAndMiddleMouseButton} />

        {/* SELECT mode |
             Ctrl/Cmd + Click --> Select nearest feature
             Shift + Click --> Add nearest feature to selection
             Alt + Click --> Remove nearest feature from selection */}
        <SelectNearestFeature active={selectedTool === Tool.SELECT}
          addCondition={ol.events.condition.never}
          layers={this.isLayerShowingActiveUAVs_}
          removeCondition={ol.events.condition.altKeyOnly}
          toggleCondition={Condition.platformModifierKeyOrShiftKeyOnly}
          select={this.onSelect_}
          threshold={40} />

        {/* SELECT mode | Ctrl/Cmd + Drag --> Box select features */}
        <interaction.DragBox active={selectedTool === Tool.SELECT}
          condition={ol.events.condition.platformModifierKeyOnly}
          boxend={this.onBoxDragEnded_} />

        {/* SELECT mode | Shift + Drag --> Box add features to selection */}
        <interaction.DragBox active={selectedTool === Tool.SELECT}
          condition={ol.events.condition.shiftKeyOnly}
          boxend={this.onBoxDragEnded_} />

        {/* SELECT mode | Alt + Drag --> Box remove features from selection */}
        <interaction.DragBox active={selectedTool === Tool.SELECT}
          condition={ol.events.condition.altKeyOnly}
          boxend={this.onBoxDragEnded_} />

        {/* ZOOM mode | Drag --> Box zoom in */}
        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.always} />

        {/* ZOOM mode | Shift + Drag --> Box zoom out */}
        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.shiftKeyOnly} out={true} />
      </Map>
    )
  }

  /**
   * Handler called when the layer showing the active UAVs is mounted.
   * We use it to store a reference to the component within
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
   * @return {boolean} whether the given layer is the one that shows the active UAVs
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
   * @param  {number}  distance  the distance of the feature from the point
   *         where the user clicked, in pixels
   */
  onSelect_ (mode, feature, distance) {
    const actionMapping = {
      'add': addSelectedFeatures,
      'clear': clearSelectedFeatures,
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
  layerOrder: PropTypes.arrayOf(PropTypes.string),
  layersById: PropTypes.object,
  projection: PropTypes.func.isRequired,
  selectedTool: PropTypes.string,
  ownLocationVisible: PropTypes.bool,
  dispatch: PropTypes.func.isRequired
}

MapViewPresentation.childContextTypes = {
  assignActiveUAVsLayerRef_: PropTypes.func,
  assignActiveUAVsLayerSourceRef_: PropTypes.func
}

const isOwnLocationVisible = state => {
  const ownLocationLayer = _.find(state.map.layers.byId, {type: 'ownlocation'})
  return typeof ownLocationLayer !== 'undefined' && ownLocationLayer.visible
}

/**
 * Connects the map view to the Redux store.
 */
const MapView = connect(
  // mapStateToProps
  state => ({
    layerOrder: state.map.layers.order,
    layersById: state.map.layers.byId,
    selectedTool: state.map.tools.selectedTool,
    ownLocationVisible: isOwnLocationVisible(state)
  })
)(MapViewPresentation)

MapView.propTypes = {
  projection: PropTypes.func.isRequired
}

MapView.defaultProps = {
  projection: coordinateFromLonLat
}

export default MapView
