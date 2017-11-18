import ol from 'openlayers'
import { Map, View, control, interaction } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Condition from './conditions'
import SelectNearestFeature from './interactions/SelectNearestFeature'
import ShowContextMenu from './interactions/ShowContextMenu'
import { Layers, stateObjectToLayer } from './layers'
import MapContextMenu from './MapContextMenu'
import MapReferenceRequestHandler from './MapReferenceRequestHandler'
import MapToolbar from './MapToolbar'
import { isDrawingTool, Tool, toolToDrawInteractionType } from './tools'

import Widget from '../Widget'

import { addFeature } from '../../actions/features'
import { addFeaturesToSelection, clearSelection, setSelectedFeatures,
  removeFeaturesFromSelection } from '../../actions/map'
import { handleError } from '../../error-handling'
import mapViewManager from '../../mapViewManager'
import { createFeatureFromOpenLayers } from '../../model/features'
import { getSelectedFeatureIds, getVisibleLayersInOrder } from '../../selectors'
import { coordinateFromLonLat, formatCoordinate } from '../../utils/geography'

require('openlayers/css/ol.css')

/**
 * React component that renders the layers of the map in the main window.
 *
 * @returns {JSX.Node}  the layers of the map
 */
const MapViewLayersPresentation = ({ layers }) => {
  let zIndex = 0
  const renderedLayers = []

  for (const layer of layers) {
    if (layer.type in Layers) {
      renderedLayers.push(stateObjectToLayer(layer, zIndex++))
    }
  }

  return <div>{renderedLayers}</div>
}

MapViewLayersPresentation.propTypes = {
  layers: PropTypes.arrayOf(PropTypes.object)
}

/**
 * Connects the map view layers to the Redux store.
 */
const MapViewLayers = connect(
  // mapStateToProps
  state => ({
    layers: getVisibleLayersInOrder(state)
  })
)(MapViewLayersPresentation)

/**
 * React component for the map of the main window.
 */
class MapViewPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._assignMapRef = this._assignMapRef.bind(this)

    this._isLayerSelectable = this._isLayerSelectable.bind(this)
    this._onBoxDragEnded = this._onBoxDragEnded.bind(this)
    this._onDrawEnded = this._onDrawEnded.bind(this)
    this._onSelect = this._onSelect.bind(this)
  }

  componentDidMount () {
    const { glContainer } = this.props
    this.layoutManager = glContainer ? glContainer.layoutManager : undefined

    mapViewManager.initialize()
    this._disableDefaultContextMenu()
  }

  componentDidUpdate () {
    const { glContainer } = this.props
    this.layoutManager = glContainer ? glContainer.layoutManager : undefined
  }

  /**
   * Returns the layout manager that the map view currently participates in.
   * @return {GoldenLayout} the layout manager
   */
  get layoutManager () {
    return this._layoutManager
  }

  /**
   * Sets the layout manager that the map view currently participates in.
   *
   * @param {GoldenLayout} value  the new layout manager
   */
  set layoutManager (value) {
    if (this._layoutManager === value) {
      return
    }

    if (this._layoutManager) {
      this._layoutManager.off('stateChanged', this.updateSize, this)
    }

    this._layoutManager = value

    if (this._layoutManager) {
      this._layoutManager.on('stateChanged', this.updateSize, this)
    }
  }

  render () {
    const { projection, selectedTool } = this.props
    const center = projection([19.061951, 47.473340])
    const view = <View center={center} zoom={17} />

    const toolClasses = {
      [Tool.SELECT]: 'tool-select',
      [Tool.ZOOM]: 'tool-zoom',
      [Tool.PAN]: 'tool-pan',
      [Tool.DRAW_CIRCLE]: 'tool-draw tool-draw-circle',
      [Tool.DRAW_PATH]: 'tool-draw tool-draw-path',
      [Tool.DRAW_POLYGON]: 'tool-draw tool-draw-polygon'
    }

    return (
      <Map view={view} ref={this._assignMapRef}
        useDefaultControls={false} loadTilesWhileInteracting focusOnMount
        className={toolClasses[selectedTool]}
      >

        <MapReferenceRequestHandler />

        <Widget style={{ top: 8, left: (8 + 24 + 8) }} showControls={false}>
          <MapToolbar />
        </Widget>

        <MapViewLayers />

        <control.MousePosition projection='EPSG:4326'
          coordinateFormat={formatCoordinate} />

        <control.ScaleLine minWidth={128} />
        <control.Zoom />

        {/* PAN mode | Ctrl/Cmd + Drag --> Box select features */}
        <interaction.DragBox active={selectedTool === Tool.PAN}
          condition={ol.events.condition.platformModifierKeyOnly}
          boxend={this._onBoxDragEnded} />

        {/* PAN mode | Alt + Shift + Drag --> Rotate view */}
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
          layers={this._isLayerSelectable}
          removeCondition={ol.events.condition.altKeyOnly}
          toggleCondition={Condition.platformModifierKeyOrShiftKeyOnly}
          select={this._onSelect}
          threshold={40} />

        {/* SELECT mode | Ctrl/Cmd + Drag --> Box select features */}
        <interaction.DragBox active={selectedTool === Tool.SELECT}
          condition={ol.events.condition.platformModifierKeyOnly}
          boxend={this._onBoxDragEnded} />

        {/* SELECT mode | Shift + Drag --> Box add features to selection */}
        <interaction.DragBox active={selectedTool === Tool.SELECT}
          condition={ol.events.condition.shiftKeyOnly}
          boxend={this._onBoxDragEnded} />

        {/* SELECT mode | Alt + Drag --> Box remove features from selection */}
        <interaction.DragBox active={selectedTool === Tool.SELECT}
          condition={ol.events.condition.altKeyOnly}
          boxend={this._onBoxDragEnded} />

        {/* ZOOM mode | Drag --> Box zoom in */}
        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.always} />

        {/* ZOOM mode | Shift + Drag --> Box zoom out */}
        <interaction.DragZoom active={selectedTool === Tool.ZOOM}
          condition={ol.events.condition.shiftKeyOnly} out />

        {/* DRAW mode | Click --> Draw a new feature */}
        <interaction.Draw active={isDrawingTool(selectedTool)}
          type={toolToDrawInteractionType(selectedTool) || 'Point'}
          drawend={this._onDrawEnded}/>

        {/* OpenLayers interaction that triggers a context menu */}
        <ShowContextMenu
          layers={this._isLayerSelectable}
          selectAction={this._onSelect}
          threshold={40}>
          {/* The context menu that appears on the map when the user right-clicks */}
          <MapContextMenu />
        </ShowContextMenu>

      </Map>
    )
  }

  /**
   * Handler called when the main map component is mounted. We use it to store
   * a reference to the component within this component.
   *
   * @param  {Map} ref  the map being shown in this component
   */
  _assignMapRef (ref) {
    this.map = ref
  }

  /**
   * Returns true if the given layer contains features that may be selected
   * by the user.
   *
   * @param {ol.Layer} layer  the layer to test
   * @return {boolean} whether the given layer contains features that may be
   *     selected by the user
   */
  _isLayerSelectable (layer) {
    return layer && layer.getVisible() && layer.get('selectable')
  }

  /**
   * Event handler that is called when the user finishes the drag-box
   * interaction on the map in "select" mode.
   *
   * @param  {ol.interaction.DragBox.Event} event  the event dispatched by
   *         the drag-box interaction
   */
  _onBoxDragEnded (event) {
    const layers = this.map.map.getLayers()
    const mapBrowserEvent = event.mapBrowserEvent

    let action

    if (ol.events.condition.altKeyOnly(mapBrowserEvent)) {
      action = removeFeaturesFromSelection
    } else if (ol.events.condition.shiftKeyOnly(mapBrowserEvent)) {
      action = addFeaturesToSelection
    } else {
      action = setSelectedFeatures
    }

    const extent = event.target.getGeometry().getExtent()
    const ids = []

    layers.getArray().filter(this._isLayerSelectable).forEach(layer => {
      const source = layer.getSource()
      source.forEachFeatureIntersectingExtent(extent, feature => {
        ids.push(feature.getId())
      })
    })

    this.props.dispatch(action(ids))
  }

  /**
   * Event handler that is called when the user finishes drawing a new
   * feature on the map in "draw" mode.
   *
   * At this stage, we only have an OpenLayers feature that is not attached
   * to a specific layer yet. This function will dispatch the appropriate
   * action to create a new feature in the Redux store, which will in turn
   * create *another* equivalent feature on the OpenLayers map. The
   * temporary feature in the event will be discarded.
   *
   * @param  {ol.interaction.Draw.Event} event  the event dispatched by the
   *         draw interaction
   */
  _onDrawEnded (event) {
    try {
      const feature = createFeatureFromOpenLayers(event.feature)
      this.props.dispatch(addFeature(feature))
    } catch (err) {
      handleError(err)
    }
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
  _onSelect (mode, feature, distance) {
    const { selectedFeatureIds } = this.props
    const id = feature ? feature.getId() : undefined
    const actionMapping = {
      'add': addFeaturesToSelection,
      'clear': clearSelection,
      'remove': removeFeaturesFromSelection,
      'toggle': selectedFeatureIds.includes(id)
        ? removeFeaturesFromSelection
        : addFeaturesToSelection
    }
    const action = actionMapping[mode] || setSelectedFeatures
    if (id) {
      this.props.dispatch(action([id]))
    }
  }

  /**
   * Method to disable the browsers default context menu.
   */
  _disableDefaultContextMenu () {
    this.map.map.getViewport().addEventListener(
      'contextmenu',
      e => {
        e.preventDefault()
        return false
      }
    )
  }

  /**
   * Method that must be called whenever the size of the container holding
   * the map view has changed.
   */
  updateSize () {
    if (this.map) {
      this.map.updateSize()
    }
  }
}

MapViewPresentation.propTypes = {
  projection: PropTypes.func.isRequired,
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedTool: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
  glContainer: PropTypes.object
}

/**
 * Connects the map view to the Redux store.
 */
const MapView = connect(
  // mapStateToProps
  state => ({
    selectedFeatureIds: getSelectedFeatureIds(state),
    selectedTool: state.map.tools.selectedTool
  })
)(MapViewPresentation)

MapView.propTypes = {
  projection: PropTypes.func.isRequired
}

MapView.defaultProps = {
  projection: coordinateFromLonLat
}

export default MapView
