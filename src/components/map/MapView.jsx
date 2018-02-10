import { autobind } from 'core-decorators'
import { Map, View, control, interaction } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Condition from './conditions'
import { MoveFeatures, SelectNearestFeature, ShowContextMenu } from './interactions'
import { Layers, stateObjectToLayer } from './layers'

import DrawingToolbar from './DrawingToolbar'
import MapContextMenu from './MapContextMenu'
import MapReferenceRequestHandler from './MapReferenceRequestHandler'
import MapToolbar from './MapToolbar'
import { isDrawingTool, Tool, toolToDrawInteractionType } from './tools'

import Widget from '../Widget'

import { addFeature, updateFeatureCoordinates } from '../../actions/features'
import { addFeaturesToSelection, clearSelection, setSelectedFeatures,
  removeFeaturesFromSelection } from '../../actions/map'
import { handleError } from '../../error-handling'
import mapViewManager from '../../mapViewManager'
import { createFeatureFromOpenLayers } from '../../model/features'
import { getVisibleSelectableLayers, isLayerSelectable } from '../../model/layers'
import { featureIdToGlobalId, globalIdToFeatureId } from '../../model/identifiers'
import { getSelectedFeatureIds, getSelection, getVisibleLayersInOrder } from '../../selectors'
import { coordinateFromLonLat, findFeaturesById, formatCoordinate } from '../../utils/geography'

require('ol/ol.css')

/* ********************************************************************** */

/**
 * React component that renders the layers of the map in the main window.
 *
 * @returns {JSX.Node[]}  the layers of the map
 */
const MapViewLayersPresentation = ({ layers }) => {
  let zIndex = 0
  const renderedLayers = []

  for (const layer of layers) {
    if (layer.type in Layers) {
      renderedLayers.push(stateObjectToLayer(layer, zIndex++))
    }
  }

  return renderedLayers
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

/* ********************************************************************** */

const MapViewControlsPresentation = props => {
  const result = [
    <control.Zoom key='control.Zoom' />
  ]

  if (props.showMouseCoordinates) {
    result.push(
      <control.MousePosition key='control.MousePosition'
        projection='EPSG:4326'
        coordinateFormat={formatCoordinate} />
    )
  }

  if (props.showScaleLine) {
    result.push(
      <control.ScaleLine key='control.ScaleLine' minWidth={128} />
    )
  }

  return result
}

/**
 * React component that renders the standard OpenLayers controls that we
 * use on the map in the main window
 */
const MapViewControls = connect(
  // mapStateToProps
  state => state.settings.display
)(MapViewControlsPresentation)

/* ********************************************************************** */

/**
 * React component that renders the toolbar of the map in the main window.
 *
 * @returns {JSX.Node[]}  the toolbars on the map
 */
const MapViewToolbars = () => ([
  <Widget style={{ top: 8, left: (8 + 24 + 8) }} showControls={false} key='Widget.MapToolbar'>
    <MapToolbar />
  </Widget>,
  <Widget style={{ top: (8 + 48 + 8), left: 8 }} showControls={false} key='Widget.DrawingToolbar'>
    <DrawingToolbar />
  </Widget>
])

/* ********************************************************************** */

/**
 * React component that renders the active interactions of the map.
 *
 * @param  {Object}  props  the props of the component
 * @returns {JSX.Node[]}  the interactions on the map
 */
const MapViewInteractions = (props) => {
  const {
    onBoxDragEnded, onDrawEnded, onFeaturesModified, onFeaturesMoved,
    onFeaturesSelected, selectedFeaturesProvider, selectedTool
  } = props
  const interactions = []

  // Common interactions that can be used regardless of the selected tool
  /* PAN mode | Alt + Shift + Drag --> Rotate view */
  interactions.push(
    <interaction.DragRotate key='*.DragRotate'
      condition={Condition.altShiftKeysOnly} />,
    <interaction.DragRotateAndZoom key='*.DragRotateAndZoom'
      condition={Condition.altShiftKeyAndMiddleMouseButton} />
  )

  if (selectedTool === Tool.PAN) {
    interactions.push(
      /* PAN mode | Ctrl/Cmd + Drag --> Box select features */
      <interaction.DragBox key='pan.DragBox'
        condition={Condition.platformModifierKeyOnly}
        boxend={onBoxDragEnded} />
    )
  }

  if (selectedTool === Tool.SELECT) {
    interactions.push(
      /* SELECT mode | Drag a feature --> Move a feature to a new location */
      <MoveFeatures key='select.MoveFeatures'
        featureProvider={selectedFeaturesProvider}
        translateend={onFeaturesMoved} />,

      /* SELECT mode |
          Ctrl/Cmd + Click --> Select nearest feature
          Shift + Click --> Add nearest feature to selection
          Alt + Click --> Remove nearest feature from selection */
      <SelectNearestFeature key='select.SelectNearestFeature'
        addCondition={Condition.never}
        layers={isLayerSelectable}
        removeCondition={Condition.altKeyOnly}
        toggleCondition={Condition.platformModifierKeyOrShiftKeyOnly}
        select={onFeaturesSelected}
        threshold={40} />,

      /* SELECT mode | Ctrl/Cmd + Drag --> Box select features */
      <interaction.DragBox key='select.DragBox.Ctrl'
        condition={Condition.platformModifierKeyOnly}
        boxend={onBoxDragEnded} />,

      /* SELECT mode | Shift + Drag --> Box add features to selection */
      <interaction.DragBox key='select.DragBox.Shift'
        condition={Condition.shiftKeyOnly}
        boxend={onBoxDragEnded} />,

      /* SELECT mode | Alt + Drag --> Box remove features from selection */
      <interaction.DragBox key='select.DragBox.Alt'
        condition={Condition.altKeyOnly}
        boxend={onBoxDragEnded} />
    )
  }

  if (selectedTool === Tool.ZOOM) {
    interactions.push(
      /* ZOOM mode | Drag --> Box zoom in */
      <interaction.DragZoom key='zoom.DragZoom'
        condition={Condition.always} />,

      /* ZOOM mode | Shift + Drag --> Box zoom out */
      <interaction.DragZoom key='zoom.DragZoom.out'
        condition={Condition.shiftKeyOnly} out />
    )
  }

  if (isDrawingTool(selectedTool)) {
    interactions.push(
      /* DRAW mode | Click --> Draw a new feature */
      <interaction.Draw key='draw.Draw'
        type={toolToDrawInteractionType(selectedTool) || 'Point'}
        drawend={onDrawEnded}/>
    )
  }

  /* Tool.EDIT_FEATURE will be handled in the FeaturesLayer component */

  return interactions
}

MapViewInteractions.propTypes = {
  selectedFeaturesProvider: PropTypes.func,
  selectedTool: PropTypes.string.isRequired,

  onBoxDragEnded: PropTypes.func,
  onDrawEnded: PropTypes.func,
  onFeaturesModified: PropTypes.func,
  onFeaturesMoved: PropTypes.func,
  onFeaturesSelected: PropTypes.func
}

/* ********************************************************************** */

/**
 * React component for the map of the main window.
 */
class MapViewPresentation extends React.Component {
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
      [Tool.DRAW_POINT]: 'tool-draw tool-draw-point',
      [Tool.DRAW_CIRCLE]: 'tool-draw tool-draw-circle',
      [Tool.DRAW_PATH]: 'tool-draw tool-draw-path',
      [Tool.DRAW_POLYGON]: 'tool-draw tool-draw-polygon',
      [Tool.EDIT_FEATURE]: 'tool-edit tool-edit-feature'
    }

    return (
      <Map view={view} ref={this._assignMapRef}
        useDefaultControls={false} loadTilesWhileInteracting focusOnMount
        className={toolClasses[selectedTool]}
      >

        <MapReferenceRequestHandler />

        <MapViewToolbars />
        <MapViewLayers />
        <MapViewControls />
        <MapViewInteractions
          selectedTool={selectedTool}
          selectedFeaturesProvider={this._getSelectedFeatures}

          onBoxDragEnded={this._onBoxDragEnded}
          onDrawEnded={this._onDrawEnded}
          onFeaturesMoved={this._onFeaturesMoved}
          onFeaturesSelected={this._onFeaturesSelected}
        />

        {/* OpenLayers interaction that triggers a context menu */}
        <ShowContextMenu
          layers={isLayerSelectable}
          selectAction={this._onFeaturesSelected}
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
  @autobind
  _assignMapRef (ref) {
    this.map = ref
  }

  @autobind
  _getSelectedFeatures (map) {
    const ids = this.props.selectedFeatures.map(featureIdToGlobalId)
    return findFeaturesById(map, ids)
  }

  /**
   * Event handler that is called when the user finishes the drag-box
   * interaction on the map in "select" mode.
   *
   * @param  {ol.interaction.DragBox.Event} event  the event dispatched by
   *         the drag-box interaction
   */
  @autobind
  _onBoxDragEnded (event) {
    const mapBrowserEvent = event.mapBrowserEvent

    let action

    if (Condition.altKeyOnly(mapBrowserEvent)) {
      action = removeFeaturesFromSelection
    } else if (Condition.shiftKeyOnly(mapBrowserEvent)) {
      action = addFeaturesToSelection
    } else {
      action = setSelectedFeatures
    }

    const extent = event.target.getGeometry().getExtent()
    const ids = []

    getVisibleSelectableLayers(this.map.map).forEach(layer => {
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
  @autobind
  _onDrawEnded (event) {
    try {
      const feature = createFeatureFromOpenLayers(event.feature)
      this.props.dispatch(addFeature(feature))
    } catch (err) {
      handleError(err)
    }
  }

  /**
   * Event handler that is called when some features were moved on the
   * map by dragging.
   *
   * @param  {MoveFeaturesInteractionEvent}  event  the event that was
   *         triggered at the end of the interaction
   * @param  {ol.Feature[]}  event.features  the features that were moved
   */
  @autobind
  _onFeaturesMoved (event) {
    const coordinates = {}
    event.features.forEach(feature => {
      const featureId = globalIdToFeatureId(feature.getId())
      coordinates[featureId] = createFeatureFromOpenLayers(feature).points
    })
    this.props.dispatch(updateFeatureCoordinates(coordinates))
  }

  /**
   * Event handler that is called when the user selects a UAV or feature on
   * the map by clicking or dragging.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         'toggle' or 'set'
   * @param  {ol.Feature}  feature  the selected feature
   * @param  {number}  distance  the distance of the feature from the point
   *         where the user clicked, in pixels
   */
  @autobind
  _onFeaturesSelected (mode, feature, distance) {
    const { selection } = this.props
    const id = feature ? feature.getId() : undefined
    const actionMapping = {
      'add': addFeaturesToSelection,
      'clear': clearSelection,
      'remove': removeFeaturesFromSelection,
      'toggle': selection.includes(id)
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
  @autobind
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
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedFeatures: PropTypes.arrayOf(PropTypes.string).isRequired,
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
    selectedFeatures: getSelectedFeatureIds(state),
    selectedTool: state.map.tools.selectedTool,
    selection: getSelection(state)
  })
)(MapViewPresentation)

MapView.propTypes = {
  projection: PropTypes.func.isRequired
}

MapView.defaultProps = {
  projection: coordinateFromLonLat
}

export default MapView
