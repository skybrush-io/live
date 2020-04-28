import filter from 'lodash-es/filter';
import isEmpty from 'lodash-es/isEmpty';
import partial from 'lodash-es/partial';
import { Map, View, control, interaction, withMap } from '@collmot/ol-react';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Condition from './conditions';
import {
  SelectNearestFeature,
  ShowContextMenu,
  TransformFeatures,
} from './interactions';
import { Layers, stateObjectToLayer } from './layers';

import DrawingToolbar from './DrawingToolbar';
import MapContextMenu from './MapContextMenu';
import MapReferenceRequestHandler from './MapReferenceRequestHandler';
import MapToolbar from './MapToolbar';
import { isDrawingTool, Tool, toolToDrawInteractionProps } from './tools';

import { addFeature, updateFeatureCoordinates } from '~/actions/features';
import {
  addFeaturesToSelection,
  setSelectedFeatures,
  removeFeaturesFromSelection,
  updateMapViewSettings,
} from '~/actions/map';
import { setFlatEarthCoordinateSystemOrigin } from '~/actions/map-origin';
import Widget from '~/components/Widget';
import { handleError } from '~/error-handling';
import mapViewManager from '~/mapViewManager';
import {
  createFeatureFromOpenLayers,
  isFeatureTransformable,
} from '~/model/features';
import { getVisibleSelectableLayers, isLayerSelectable } from '~/model/layers';
import { globalIdToFeatureId, globalIdToOriginId } from '~/model/identifiers';
import { getVisibleLayersInOrder } from '~/selectors/ordered';
import { getExtendedCoordinateFormatter } from '~/selectors/formatting';
import { getMapViewRotationAngle } from '~/selectors/map';
import { getSelectedFeatureIds, getSelection } from '~/selectors/selection';
import {
  mapViewCoordinateFromLonLat,
  findFeaturesById,
  lonLatFromMapViewCoordinate,
} from '~/utils/geography';
import { toDegrees } from '~/utils/math';

require('ol/ol.css');

/* ********************************************************************** */

/**
 * React component that renders the layers of the map in the main window.
 *
 * @returns {JSX.Node[]}  the layers of the map
 */
const MapViewLayersPresentation = ({
  layers,
  onFeaturesModified,
  selectedTool,
}) => {
  let zIndex = 0;
  const renderedLayers = [];

  for (const layer of layers) {
    if (layer.type in Layers) {
      renderedLayers.push(
        stateObjectToLayer(layer, {
          onFeaturesModified,
          selectedTool,
          zIndex,
        })
      );
      zIndex++;
    }
  }

  return renderedLayers;
};

MapViewLayersPresentation.propTypes = {
  layers: PropTypes.arrayOf(PropTypes.object),
  onFeaturesModified: PropTypes.func,
  selectedTool: PropTypes.string.isRequired,
};

/**
 * Connects the map view layers to the Redux store.
 */
const MapViewLayers = connect(
  // mapStateToProps
  (state) => ({
    layers: getVisibleLayersInOrder(state),
    selectedTool: state.map.tools.selectedTool,
  })
)(MapViewLayersPresentation);

/* ********************************************************************** */

const MapViewControlsPresentation = (props) => {
  const result = [
    <control.Zoom key='control.Zoom' />,
    <control.Attribution
      collapsed
      key='control.Attribution'
      collapseLabel='&laquo;'
    />,
  ];

  if (props.showMouseCoordinates) {
    result.push(
      <control.MousePosition
        key='control.MousePosition'
        projection='EPSG:4326'
        coordinateFormat={props.formatCoordinate}
      />
    );
  }

  if (props.showScaleLine) {
    result.push(<control.ScaleLine key='control.ScaleLine' minWidth={128} />);
  }

  return result;
};

/**
 * React component that renders the standard OpenLayers controls that we
 * use on the map in the main window
 */
const MapViewControls = connect(
  // mapStateToProps
  (state) => ({
    formatCoordinate: getExtendedCoordinateFormatter(state),
    ...state.settings.display,
  })
)(MapViewControlsPresentation);

/* ********************************************************************** */

/**
 * React component that renders the toolbar of the map in the main window.
 *
 * @returns {JSX.Node[]}  the toolbars on the map
 */
const MapViewToolbars = () => [
  <Widget
    key='Widget.MapToolbar'
    style={{ top: 8, left: 8 + 24 + 8 }}
    showControls={false}
  >
    <MapToolbar />
  </Widget>,
  <Widget
    key='Widget.DrawingToolbar'
    style={{ top: 8 + 48 + 8, left: 8 }}
    showControls={false}
  >
    <DrawingToolbar />
  </Widget>,
];

/* ********************************************************************** */

/**
 * React component that renders the active interactions of the map.
 *
 * @param  {Object}  props    the props of the component
 * @returns {JSX.Node[]}  the interactions on the map
 */
const MapViewInteractions = withMap((props) => {
  const {
    onDrawEnded,
    onAddFeaturesToSelection,
    onFeaturesTransformed,
    onRemoveFeaturesFromSelection,
    onSetSelectedFeatures,
    onSingleFeatureSelected,
    selectedFeaturesProvider,
    selectedTool,
  } = props;
  const interactions = [];

  // Common interactions that can be used regardless of the selected tool
  /* Alt + Shift + drag --> Rotate view */
  /* Alt + Shift + middle button drag --> Rotate and zoom view */
  interactions.push(
    <interaction.DragRotate
      key='DragRotate'
      condition={Condition.altShiftKeysOnly}
    />,
    <interaction.DragRotateAndZoom
      key='DragRotateAndZoom'
      condition={Condition.altShiftKeyAndMiddleMouseButton}
    />
  );

  if (selectedTool === Tool.PAN) {
    interactions.push(
      /* PAN mode | Ctrl/Cmd + Drag --> Box select features */
      <interaction.DragBox
        key='DragBox.setSelection'
        condition={Condition.platformModifierKeyOnly}
        onBoxEnd={onSetSelectedFeatures}
      />
    );
  }

  if (selectedTool === Tool.SELECT) {
    interactions.push(
      /* SELECT mode |
          click --> Select nearest feature
          PlatMod + Click --> Toggle nearest feature in selection
          Alt + Click --> Remove nearest feature from selection */
      <SelectNearestFeature
        key='SelectNearestFeature'
        addCondition={Condition.never}
        layers={isLayerSelectable}
        removeCondition={Condition.altKeyOnly}
        toggleCondition={Condition.platformModifierKeyOnly}
        threshold={40}
        onSelect={onSingleFeatureSelected}
      />,

      /* We cannot add "Drag --> Set selected features" here because it
       * interferes with the SelectNearestFeature interaction */

      /* SELECT mode | Shift + Drag --> Box add features to selection */
      <interaction.DragBox
        key='DragBox.addToSelection'
        condition={Condition.shiftKeyOnly}
        onBoxEnd={onAddFeaturesToSelection}
      />,

      /* SELECT mode | Alt + Drag --> Box remove features from selection */
      <interaction.DragBox
        key='DragBox.removeFromSelection'
        condition={Condition.altKeyOnly}
        onBoxEnd={onRemoveFeaturesFromSelection}
      />,

      /* SELECT mode |
           Drag a feature --> Move a feature to a new location
           Alt + Drag --> Rotate a feature.
         This must come last in order to ensure that it will get the
         chance to process events before DragBox so Alt+something will not
         start a drag-box when clicking on a selected feature */
      <TransformFeatures
        key='TransformFeatures'
        featureProvider={selectedFeaturesProvider}
        moveCondition={Condition.noModifierKeys}
        rotateCondition={Condition.altKeyOnly}
        onTransformEnd={onFeaturesTransformed}
      />
    );
  }

  if (selectedTool === Tool.ZOOM) {
    interactions.push(
      /* ZOOM mode | Drag --> Box zoom in */
      <interaction.DragZoom key='DragZoom.in' condition={Condition.always} />,

      /* ZOOM mode | Shift + Drag --> Box zoom out */
      <interaction.DragZoom
        key='DragZoom.out'
        out
        condition={Condition.shiftKeyOnly}
      />
    );
  }

  if (isDrawingTool(selectedTool)) {
    interactions.push(
      /* DRAW mode | Click --> Draw a new feature */
      <interaction.Draw
        key='Draw'
        {...toolToDrawInteractionProps(selectedTool, props.map)}
        onDrawEnd={onDrawEnded}
      />
    );
  }

  /* Tool.EDIT_FEATURE will be handled in the FeaturesLayer component */

  return interactions;
});

MapViewInteractions.propTypes = {
  selectedFeaturesProvider: PropTypes.func,
  selectedTool: PropTypes.string.isRequired,

  onAddFeaturesToSelection: PropTypes.func,
  onDrawEnded: PropTypes.func,
  onFeaturesTransformed: PropTypes.func,
  onRemoveFeaturesFromSelection: PropTypes.func,
  onSetSelectedFeatures: PropTypes.func,
  onSingleFeatureSelected: PropTypes.func,
};

/* ********************************************************************** */

/**
 * React component for the map of the main window.
 */
class MapViewPresentation extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,

    center: PropTypes.arrayOf(PropTypes.number),
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedTool: PropTypes.string,
    zoom: PropTypes.number,

    glContainer: PropTypes.object,
  };

  static defaultProps = {
    center: [19.061951, 47.47334],
    zoom: 17,
  };

  constructor(props) {
    super(props);

    this._onAddFeaturesToSelection = partial(this._onBoxDragEnded, 'add');
    this._onRemoveFeaturesFromSelection = partial(
      this._onBoxDragEnded,
      'remove'
    );
    this._onSetSelectedFeatures = partial(this._onBoxDragEnded, 'set');

    this._map = React.createRef();
  }

  componentDidMount() {
    const { glContainer } = this.props;
    this.layoutManager = glContainer ? glContainer.layoutManager : undefined;

    mapViewManager.initialize();
    this._disableDefaultContextMenu();
  }

  componentDidUpdate() {
    const { glContainer } = this.props;
    this.layoutManager = glContainer ? glContainer.layoutManager : undefined;
  }

  /**
   * Returns the layout manager that the map view currently participates in.
   * @return {GoldenLayout} the layout manager
   */
  get layoutManager() {
    return this._layoutManager;
  }

  /**
   * Sets the layout manager that the map view currently participates in.
   *
   * @param {GoldenLayout} value  the new layout manager
   */
  set layoutManager(value) {
    if (this._layoutManager === value) {
      return;
    }

    if (this._layoutManager) {
      this._layoutManager.off('stateChanged', this.updateSize, this);
    }

    this._layoutManager = value;

    if (this._layoutManager) {
      this._layoutManager.on('stateChanged', this.updateSize, this);
    }
  }

  render() {
    const { center, selectedTool, zoom } = this.props;
    const view = (
      <View
        center={mapViewCoordinateFromLonLat(center)}
        zoom={zoom}
        constrainRotation={false}
      />
    );

    const toolClasses = {
      [Tool.SELECT]: 'tool-select',
      [Tool.ZOOM]: 'tool-zoom',
      [Tool.PAN]: 'tool-pan',
      [Tool.DRAW_POINT]: 'tool-draw tool-draw-point',
      [Tool.DRAW_CIRCLE]: 'tool-draw tool-draw-circle',
      [Tool.DRAW_RECTANGLE]: 'tool-draw tool-draw-rectangle',
      [Tool.DRAW_PATH]: 'tool-draw tool-draw-path',
      [Tool.DRAW_POLYGON]: 'tool-draw tool-draw-polygon',
      [Tool.EDIT_FEATURE]: 'tool-edit tool-edit-feature',
    };

    // Note that we use a background color. This is intenitonal -- vector tile
    // based maps assume that there is a light background.

    return (
      <Map
        ref={this._map}
        loadTilesWhileInteracting
        id='tour-map'
        view={view}
        useDefaultControls={false}
        className={toolClasses[selectedTool]}
        style={{ background: '#f8f4f0' }}
        onMoveEnd={this._onMapMoved}
      >
        <MapReferenceRequestHandler />

        <MapViewToolbars />
        <MapViewLayers onFeaturesModified={this._onFeaturesModified} />
        <MapViewControls />
        <MapViewInteractions
          selectedTool={selectedTool}
          selectedFeaturesProvider={this._getSelectedTransformableFeatures}
          onAddFeaturesToSelection={this._onAddFeaturesToSelection}
          onDrawEnded={this._onDrawEnded}
          onFeaturesTransformed={this._onFeaturesTransformed}
          onRemoveFeaturesFromSelection={this._onRemoveFeaturesFromSelection}
          onSetSelectedFeatures={this._onSetSelectedFeatures}
          onSingleFeatureSelected={this._onFeatureSelected}
        />

        {/* OpenLayers interaction that triggers a context menu */}
        <ShowContextMenu
          layers={isLayerSelectable}
          projection='EPSG:4326'
          selectAction={this._onFeatureSelected}
          threshold={40}
        >
          {/* The context menu that appears on the map when the user right-clicks */}
          <MapContextMenu />
        </ShowContextMenu>
      </Map>
    );
  }

  /**
   * Returns the selected features that can be transformed with a standard
   * transformation interaction in an array. The selection includes not
   * only user-defined features but anything that can be transformed (e.g.,
   * home position objects).
   *
   * @param  {Map} map  the map
   * @return {ol.Feature[]} the selected OpenLayers features
   */
  _getSelectedTransformableFeatures = (map) => {
    return filter(
      findFeaturesById(map, this.props.selection),
      isFeatureTransformable
    );
  };

  /**
   * Event handler that is called when the user finishes a drag-box
   * interaction on the map.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         or 'set'
   * @param  {ol.interaction.DragBox.Event} event  the event dispatched by
   *         the drag-box interaction
   */
  _onBoxDragEnded = (mode, event) => {
    const extent = event.target.getGeometry().getExtent();
    const features = [];
    const { map } = this._map.current;

    getVisibleSelectableLayers(map).forEach((layer) => {
      const source = layer.getSource();
      source.forEachFeatureIntersectingExtent(extent, (feature) => {
        features.push(feature);
      });
    });

    this._onFeaturesSelected(mode, features);
  };

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
  _onDrawEnded = (event) => {
    try {
      const feature = createFeatureFromOpenLayers(event.feature);
      this.props.dispatch(addFeature(feature));
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Event handler that is called when some features were modified on the
   * map after adding / moving / removing its constituent vertices.
   *
   * @param  {ol.interaction.Modify.Event}  event  the event that was
   *         triggered at the end of the interaction
   * @param  {ol.Feature[]}  event.features  the features that were modified
   */
  _onFeaturesModified = (event) => {
    this._updateFeatures(event.features);
  };

  /**
   * Event handler that is called when some features were moved on the
   * map by dragging.
   *
   * @param  {TransformFeaturesInteractionEvent}  event  the event that was
   *         triggered at the end of the interaction
   * @param  {ol.Feature[]}  event.features  the features that were moved
   */
  _onFeaturesTransformed = (event) => {
    this._updateFeatures(event.features);
  };

  /**
   * Event handler that is called when the user selects a single UAV or
   * feature on the map by clicking.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         'clear', 'toggle' or 'set'
   * @param  {ol.Feature}  feature  the selected feature
   */
  _onFeatureSelected = (mode, feature) => {
    const id = feature ? feature.getId() : undefined;
    if (id === undefined && mode !== 'set' && mode !== 'clear') {
      return;
    }

    if (mode === 'toggle') {
      const { selection } = this.props;
      mode = selection.includes(id) ? 'remove' : 'add';
    } else if (mode === 'clear') {
      mode = 'set';
      feature = undefined;
    }

    this._onFeaturesSelected(mode, feature ? [feature] : []);
  };

  /**
   * Event handler that is called when the user selects multiple UAVs or
   * features on the map by clicking or dragging.
   *
   * @param  {string}  mode  the selection mode; one of 'add', 'remove',
   *         or 'set'
   * @param  {ol.Feature[]}  features  the selected features
   */
  _onFeaturesSelected = (mode, features) => {
    const actionMapping = {
      add: addFeaturesToSelection,
      remove: removeFeaturesFromSelection,
      set: setSelectedFeatures,
    };
    const action = actionMapping[mode] || setSelectedFeatures;
    const ids = features ? features.map((feature) => feature.getId()) : [];
    if (action === setSelectedFeatures || (ids && ids.length > 0)) {
      this.props.dispatch(action(ids));
    }
  };

  _onMapMoved = () => {
    const { map } = this._map.current;
    const view = map ? map.getView() : undefined;

    if (view) {
      const position = lonLatFromMapViewCoordinate(view.getCenter());
      const zoom = view.getZoom();
      const angle = toDegrees(-view.getRotation());

      this.props.dispatch(
        updateMapViewSettings({
          position,
          angle,
          zoom,
        })
      );
    }
  };

  /**
   * Common implementation for `_onFeaturesTransformed` and `_onFeaturesModified`.
   *
   * @param  {ol.Feature[]}  features  the features that are to be updated
   */
  _updateFeatures(features) {
    const updatedUserFeatures = {};
    const { dispatch } = this.props;

    features.forEach((feature) => {
      const globalId = feature.getId();
      const userFeatureId = globalIdToFeatureId(globalId);
      if (userFeatureId) {
        // Feature is a user-defined feature so update it in the Redux store
        updatedUserFeatures[userFeatureId] = createFeatureFromOpenLayers(
          feature
        ).points;
      } else {
        const originFeatureId = globalIdToOriginId(globalId);
        if (originFeatureId === '') {
          // Feature is a coordinate system origin feature
          const featureObject = createFeatureFromOpenLayers(feature);
          const coords = feature.getGeometry().getCoordinates();
          dispatch(
            setFlatEarthCoordinateSystemOrigin(
              featureObject.points[0],
              90 -
                toDegrees(
                  Math.atan2(
                    // Don't use featureObject.points here because they are already
                    // in lat-lon so they cannot be used to calculate an angle
                    coords[1][1] - coords[0][1],
                    coords[1][0] - coords[0][0]
                  )
                )
            )
          );
        }
      }
    });

    if (!isEmpty(updatedUserFeatures)) {
      dispatch(updateFeatureCoordinates(updatedUserFeatures));
    }
  }

  /**
   * Method to disable the browsers default context menu.
   */
  _disableDefaultContextMenu = () => {
    const { map } = this._map.current;
    map.getViewport().addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  };

  /**
   * Method that must be called whenever the size of the container holding
   * the map view has changed.
   */
  updateSize() {
    const map = this._map.current;
    if (map) {
      map.updateSize();
    }
  }
}

/**
 * Connects the map view to the Redux store.
 */
const MapView = connect(
  // mapStateToProps
  (state) => ({
    center: state.map.view.position,
    rotation: getMapViewRotationAngle(state),
    zoom: state.map.view.zoom,

    selectedFeatures: getSelectedFeatureIds(state),
    selectedTool: state.map.tools.selectedTool,
    selection: getSelection(state),
  })
)(MapViewPresentation);

export default MapView;
