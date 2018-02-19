import { autobind } from 'core-decorators'
import { partial } from 'lodash'
import OLMap from 'ol/map'
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
import { isDrawingTool, Tool, toolToDrawInteractionProps } from './tools'

import { addFeature, updateFeatureCoordinates } from '../../actions/features'
import { addFeaturesToSelection, setSelectedFeatures,
  removeFeaturesFromSelection } from '../../actions/map'
import Widget from '../../components/Widget'
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
const MapViewLayersPresentation = ({ layers, onFeaturesModified, selectedTool }) => {
  let zIndex = 0
  const renderedLayers = []

  for (const layer of layers) {
    if (layer.type in Layers) {
      renderedLayers.push(stateObjectToLayer(layer, {
        onFeaturesModified,
        selectedTool,
        zIndex
      }))
      zIndex++
    }
  }

  return renderedLayers
}

MapViewLayersPresentation.propTypes = {
  layers: PropTypes.arrayOf(PropTypes.object),
  onFeaturesModified: PropTypes.func,
  selectedTool: PropTypes.string.isRequired
}

/**
 * Connects the map view layers to the Redux store.
 */
const MapViewLayers = connect(
  // mapStateToProps
  state => ({
    layers: getVisibleLayersInOrder(state),
    selectedTool: state.map.tools.selectedTool
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
 * @param  {Object}  props    the props of the component
 * @param  {Object}  context  the context of the component
 * @returns {JSX.Node[]}  the interactions on the map
 */
const MapViewInteractions = (props, context) => {
  const {
    onDrawEnded, onAddFeaturesToSelection,
    onFeaturesMoved, onRemoveFeaturesFromSelection,
    onSetSelectedFeatures, onSingleFeatureSelected,
    selectedFeaturesProvider, selectedTool
  } = props
  const interactions = []

  // Common interactions that can be used regardless of the selected tool
  /* Alt + Shift + drag --> Rotate view */
  /* Alt + Shift + middle button drag --> Rotate and zoom view */
  interactions.push(
    <interaction.DragRotate key='DragRotate'
      condition={Condition.altShiftKeysOnly} />,
    <interaction.DragRotateAndZoom key='DragRotateAndZoom'
      condition={Condition.altShiftKeyAndMiddleMouseButton} />
  )

  if (selectedTool === Tool.PAN) {
    interactions.push(
      /* PAN mode | Ctrl/Cmd + Drag --> Box select features */
      <interaction.DragBox key='DragBox.setSelection'
        condition={Condition.platformModifierKeyOnly}
        boxend={onSetSelectedFeatures} />
    )
  }

  if (selectedTool === Tool.SELECT) {
    interactions.push(
      /* SELECT mode | Drag a feature --> Move a feature to a new location */
      <MoveFeatures key='MoveFeatures'
        featureProvider={selectedFeaturesProvider}
        translateend={onFeaturesMoved} />,

      /* SELECT mode |
          click --> Select nearest feature
          Shift + Click or PlatMod + Click --> Toggle nearest feature in selection
          Alt + Click --> Remove nearest feature from selection */
      <SelectNearestFeature key='SelectNearestFeature'
        addCondition={Condition.never}
        layers={isLayerSelectable}
        removeCondition={Condition.altKeyOnly}
        toggleCondition={Condition.platformModifierKeyOrShiftKeyOnly}
        select={onSingleFeatureSelected}
        threshold={40} />,

      /* We cannot add "Drag --> Set selected features" here because it
       * interferes with the MoveFeatures interaction */

      /* SELECT mode | Shift + Drag --> Box add features to selection */
      <interaction.DragBox key='DragBox.addToSelection'
        condition={Condition.shiftKeyOnly}
        boxend={onAddFeaturesToSelection} />,

      /* SELECT mode | Alt + Drag --> Box remove features from selection */
      <interaction.DragBox key='DragBox.removeFromSelection'
        condition={Condition.altKeyOnly}
        boxend={onRemoveFeaturesFromSelection} />
    )
  }

  if (selectedTool === Tool.ZOOM) {
    interactions.push(
      /* ZOOM mode | Drag --> Box zoom in */
      <interaction.DragZoom key='DragZoom.in'
        condition={Condition.always} />,

      /* ZOOM mode | Shift + Drag --> Box zoom out */
      <interaction.DragZoom key='DragZoom.out'
        condition={Condition.shiftKeyOnly} out />
    )
  }

  if (isDrawingTool(selectedTool)) {
    interactions.push(
      /* DRAW mode | Click --> Draw a new feature */
      <interaction.Draw key='Draw'
        {...toolToDrawInteractionProps(selectedTool, context.map)}
        drawend={onDrawEnded}/>
    )
  }

  /* Tool.EDIT_FEATURE will be handled in the FeaturesLayer component */

  return interactions
}

MapViewInteractions.propTypes = {
  selectedFeaturesProvider: PropTypes.func,
  selectedTool: PropTypes.string.isRequired,

  onAddFeaturesToSelection: PropTypes.func,
  onDrawEnded: PropTypes.func,
  onFeaturesMoved: PropTypes.func,
  onRemoveFeaturesFromSelection: PropTypes.func,
  onSetSelectedFeatures: PropTypes.func,
  onSingleFeatureSelected: PropTypes.func
}

MapViewInteractions.contextTypes = {
  map: PropTypes.instanceOf(OLMap)
}

/* ********************************************************************** */

/**
 * React component for the map of the main window.
 */
class MapViewPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._onAddFeaturesToSelection = partial(this._onBoxDragEnded, 'add')
    this._onRemoveFeaturesFromSelection = partial(this._onBoxDragEnded, 'remove')
    this._onSetSelectedFeatures = partial(this._onBoxDragEnded, 'set')
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
      [Tool.DRAW_POINT]: 'tool-draw tool-draw-point',
      [Tool.DRAW_CIRCLE]: 'tool-draw tool-draw-circle',
      [Tool.DRAW_RECTANGLE]: 'tool-draw tool-draw-rectangle',
      [Tool.DRAW_PATH]: 'tool-draw tool-draw-path',
      [Tool.DRAW_POLYGON]: 'tool-draw tool-draw-polygon',
      [Tool.EDIT_FEATURE]: 'tool-edit tool-edit-feature'
    }

    return (
      <Map view={view} ref={this._assignMapRef}
        useDefaultControls={false} loadTilesWhileInteracting
        className={toolClasses[selectedTool]}
      >

        <MapReferenceRequestHandler />

        <MapViewToolbars />
        <MapViewLayers onFeaturesModified={this._onFeaturesModified} />
        <MapViewControls />
        <MapViewInteractions
          selectedTool={selectedTool}
          selectedFeaturesProvider={this._getSelectedFeatures}

          onAddFeaturesToSelection={this._onAddFeaturesToSelection}
          onDrawEnded={this._onDrawEnded}
          onFeaturesMoved={this._onFeaturesMoved}
          onRemoveFeaturesFromSelection={this._onRemoveFeaturesFromSelection}
          onSetSelectedFeatures={this._onSetSelectedFeatures}
          onSingleFeatureSelected={this._onFeatureSelected}
        />

        {/* OpenLayers interaction that triggers a context menu */}
        <ShowContextMenu
          layers={isLayerSelectable}
          selectAction={this._onFeatureSelected}
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
   * Event handler that is called when the user finishes a drag-box
   * interaction on the map.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         or 'set'
   * @param  {ol.interaction.DragBox.Event} event  the event dispatched by
   *         the drag-box interaction
   */
  @autobind
  _onBoxDragEnded (mode, event) {
    const extent = event.target.getGeometry().getExtent()
    const features = []

    getVisibleSelectableLayers(this.map.map).forEach(layer => {
      const source = layer.getSource()
      source.forEachFeatureIntersectingExtent(extent, feature => {
        features.push(feature)
      })
    })

    this._onFeaturesSelected(mode, features)
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
   * Event handler that is called when some features were modified on the
   * map after adding / moving / removing its constituent vertices.
   *
   * @param  {ol.interaction.Modify.Event}  event  the event that was
   *         triggered at the end of the interaction
   * @param  {ol.Feature[]}  event.features  the features that were modified
   */
  @autobind
  _onFeaturesModified (event) {
    this._updateFeatures(event.features)
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
    this._updateFeatures(event.features)
  }

  /**
   * Event handler that is called when the user selects a single UAV or
   * feature on the map by clicking.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         'clear', 'toggle' or 'set'
   * @param  {ol.Feature}  feature  the selected feature
   */
  @autobind
  _onFeatureSelected (mode, feature) {
    const id = feature ? feature.getId() : undefined
    if (id === undefined && mode !== 'set' && mode !== 'clear') {
      return
    }

    if (mode === 'toggle') {
      const { selection } = this.props
      mode = selection.includes(id) ? 'remove' : 'add'
    } else if (mode === 'clear') {
      mode = 'set'
      feature = undefined
    }

    this._onFeaturesSelected(mode, feature ? [feature] : [])
  }

  /**
   * Event handler that is called when the user selects multiple UAVs or
   * features on the map by clicking or dragging.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         or 'set'
   * @param  {ol.Feature[]}  features  the selected features
   */
  @autobind
  _onFeaturesSelected (mode, features) {
    const actionMapping = {
      'add': addFeaturesToSelection,
      'remove': removeFeaturesFromSelection,
      'set': setSelectedFeatures
    }
    const action = actionMapping[mode] || setSelectedFeatures
    const ids = features ? features.map(feature => feature.getId()) : []
    if (action === setSelectedFeatures || (ids && ids.length > 0)) {
      this.props.dispatch(action(ids))
    }
  }

  /**
   * Common implementation for `_onFeaturesMoved` and `_onFeaturesModified`.
   *
   * @param  {ol.Feature[]}  features  the features that are to be updated
   */
  _updateFeatures (features) {
    const coordinates = {}
    features.forEach(feature => {
      const featureId = globalIdToFeatureId(feature.getId())
      coordinates[featureId] = createFeatureFromOpenLayers(feature).points
    })
    this.props.dispatch(updateFeatureCoordinates(coordinates))
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
