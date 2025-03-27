import config from 'config';
import filter from 'lodash-es/filter';
import partial from 'lodash-es/partial';
import Collection from 'ol/Collection';
import { transform } from 'ol/proj';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { interaction, Map, View, withMap } from '@collmot/ol-react';

import { MapControls, MapToolbars } from '~/components/map';
import * as Condition from '~/components/map/conditions';
import {
  SelectNearestFeature,
  ShowContextMenu,
  TrackNearestFeature,
  TransformFeatures,
} from '~/components/map/interactions';
import { snapEndToStart } from '~/components/map/interactions/utils';
import { MapLayers as MapLayersPresentation } from '~/components/map/layers';
import {
  styles as mapStyles,
  toolClasses,
  viewDefaults,
} from '~/components/map/Map';
import {
  isDrawingTool,
  Tool,
  toolToDrawInteractionProps,
} from '~/components/map/tools';
import { handleError } from '~/error-handling';
import {
  addFeature,
  showDetailsForFeatureInTooltipOrGivenFeature,
} from '~/features/map-features/actions';
import { getSelectedFeatureIds } from '~/features/map-features/selectors';
import {
  addToSelection,
  removeFromSelection,
  setSelection,
  toggleInSelection,
} from '~/features/map/selection';
import { getSelectedTool } from '~/features/map/tools';
import { updateMapViewSettings } from '~/features/map/view';
import { addNewMissionItem } from '~/features/mission/actions';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import NearestItemTooltip from '~/features/session/NearestItemTooltip';
import { setFeatureIdForTooltip } from '~/features/session/slice';
import { getFollowMapSelectionInUAVDetailsPanel } from '~/features/uavs/selectors';
import mapViewManager from '~/mapViewManager';
import { featureIdToGlobalId } from '~/model/identifiers';
import {
  canLayerTriggerTooltip,
  getVisibleEditableLayers,
  getVisibleSelectableLayers,
  isLayerVisibleAndSelectable,
} from '~/model/layers';
import { MissionItemType } from '~/model/missions';
import {
  createFeaturesFromOpenLayers,
  handleFeatureUpdatesInOpenLayers,
  isFeatureModifiable,
  isFeatureTransformable,
} from '~/model/openlayers';
import {
  getMapViewCenterPosition,
  getMapViewRotationAngle,
  getMapViewZoom,
} from '~/selectors/map';
import { getVisibleLayersInOrder } from '~/selectors/ordered';
import { getSelection } from '~/selectors/selection';
import {
  findFeaturesById,
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';
import { toDegrees } from '~/utils/math';
import { forwardCollectionChanges } from '~/utils/openlayers';
import DrawingToolbar from './DrawingToolbar';
import { Layers } from './layers';
import MapContextMenu from './MapContextMenu';
import MapReferenceRequestHandler from './MapReferenceRequestHandler';

import 'ol/ol.css';

/* ********************************************************************** */

/**
 * Connects the map view layers to the Redux store.
 */
const MapViewLayers = connect(
  // mapStateToProps
  (state) => ({
    layers: getVisibleLayersInOrder(state),
    selectedTool: getSelectedTool(state),
    layerComponents: Layers,
  })
)(MapLayersPresentation);

/* ********************************************************************** */

/**
 * React component that renders the active interactions of the map.
 *
 * @param  {Object}  props    the props of the component
 * @returns {JSX.Node[]}  the interactions on the map
 */
const MapViewInteractions = withMap((props) => {
  const {
    geofencePolygonId,
    onAddFeaturesToSelection,
    onAddWaypoint,
    onDrawEnded,
    onFeatureModificationStarted,
    onFeaturesModified,
    onFeaturesTransformed,
    onNearestFeatureChanged,
    onRemoveFeaturesFromSelection,
    onSetSelectedFeatures,
    onSingleFeatureSelected,
    selectedFeaturesProvider,
    selectedTool,
  } = props;

  const onModifyStart = useCallback(
    (event) => {
      event.features
        .getArray()
        .find((f) => f.getId() === featureIdToGlobalId(geofencePolygonId))
        ?.getGeometry()
        .on('change', snapEndToStart);

      onFeatureModificationStarted?.(event);
    },
    [onFeatureModificationStarted, geofencePolygonId]
  );

  const onModifyEnd = useCallback(
    (event) => {
      event.features
        .getArray()
        .find((f) => f.getId() === featureIdToGlobalId(geofencePolygonId))
        ?.getGeometry()
        .un('change', snapEndToStart);

      onFeaturesModified?.(event);
    },
    [onFeaturesModified, geofencePolygonId]
  );

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
    />,
    /* Custom "interaction" that is responsible for managing the tooltip that
     * shows the properties of the nearest UAV. */
    <TrackNearestFeature
      key='TrackNearestFeature'
      layers={canLayerTriggerTooltip}
      hitTolerance={4}
      onNearestFeatureChanged={onNearestFeatureChanged}
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
          Shift + Click --> Add nearest feature to selection
          PlatMod + Click --> Toggle nearest feature in selection
          Alt + Click --> Remove nearest feature from selection */
      <SelectNearestFeature
        key='SelectNearestFeature'
        activateCondition={Condition.doubleClick}
        addCondition={Condition.shiftKeyOnly}
        layers={isLayerVisibleAndSelectable}
        removeCondition={Condition.altKeyOnly}
        toggleCondition={Condition.platformModifierKeyOnly}
        threshold={16}
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
      /* DRAW mode | Click --> Draw a new feature | Esc -> Abort drawing */
      <interaction.AbortableDraw
        key='Draw'
        {...toolToDrawInteractionProps(selectedTool, props.map)}
        abortCondition={Condition.escapeKeyDown}
        onDrawEnd={onDrawEnded}
      />
    );
  }

  if (selectedTool === Tool.ADD_WAYPOINT) {
    interactions.push(
      <interaction.Draw
        key='AddWaypoint'
        type='Point'
        condition={Condition.primaryAction}
        onDrawEnd={onAddWaypoint}
      />
    );
  }

  // NOTE:
  // The `Modify` interaction requires either a source or a feature collection,
  // but we'd like to have it act on multiple layers, so we create a new merged
  // (and filtered) collection, into which we forward the modifiable features
  // from both layers.
  // Having two separate interactions for the two layers would result in
  // multiple interaction points showing up simultaneously on the map if
  // features from different layers are close to each other.
  const modifiableFeaturesOfVisibleEditableLayers = new Collection();
  for (const vel of getVisibleEditableLayers(props.map)) {
    forwardCollectionChanges(
      vel.getSource().getFeaturesCollection(),
      modifiableFeaturesOfVisibleEditableLayers,
      isFeatureModifiable
    );
  }

  if (selectedTool === Tool.EDIT_FEATURE) {
    interactions.push(
      <interaction.Modify
        key='EditFeature'
        features={modifiableFeaturesOfVisibleEditableLayers}
        onModifyStart={onModifyStart}
        onModifyEnd={onModifyEnd}
      />
    );
  }

  /*
   * Tool.CUT_HOLE and Tool.EDIT_FEATURE are
   * handled in the FeaturesLayer component
   */

  return interactions;
});

MapViewInteractions.propTypes = {
  selectedFeaturesProvider: PropTypes.func,
  selectedTool: PropTypes.string.isRequired,

  onAddFeaturesToSelection: PropTypes.func,
  onAddWaypoint: PropTypes.func,
  onDrawEnded: PropTypes.func,
  onFeaturesTransformed: PropTypes.func,
  onNearestFeatureChanged: PropTypes.func,
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
    rotation: PropTypes.number,
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedTool: PropTypes.string,
    zoom: PropTypes.number,

    glContainer: PropTypes.object,
    excludedLayerTypes: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = { ...viewDefaults };

  constructor(props) {
    super(props);

    this._onAddFeaturesToSelection = partial(this._onBoxDragEnded, 'add');
    this._onRemoveFeaturesFromSelection = partial(
      this._onBoxDragEnded,
      'remove'
    );
    this._onSetSelectedFeatures = partial(this._onBoxDragEnded, 'set');

    this._map = React.createRef();
    this._mapInnerDiv = React.createRef();
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
    const {
      center,
      excludedLayerTypes,
      geofencePolygonId,
      rotation,
      selectedTool,
      zoom,
    } = this.props;
    const view = (
      <View
        center={mapViewCoordinateFromLonLat(center)}
        rotation={(-rotation * Math.PI) / 180}
        zoom={zoom}
        maxZoom={24}
        constrainRotation={false}
      />
    );

    // Note that we use a <div> to wrap the map; this is because Tippy.js
    // tooltips need a ref to a DOM node, but attaching a ref to the Map will
    // give access to the underlying OpenLayers Map object instead.
    return (
      <NearestItemTooltip>
        <div style={mapStyles.mapWrapper}>
          <Map
            ref={this._map}
            loadTilesWhileInteracting
            id='main-map-view'
            view={view}
            useDefaultControls={false}
            className={toolClasses[selectedTool]}
            style={mapStyles.map}
            onMoveEnd={this._onMapMoved}
          >
            <MapReferenceRequestHandler />

            <MapToolbars>
              {{
                drawingToolbar: (
                  <DrawingToolbar drawingTools={config.map.drawingTools} />
                ),
              }}
            </MapToolbars>
            <MapViewLayers
              onFeaturesModified={this._onFeaturesModified}
              excludedLayerTypes={excludedLayerTypes}
            />
            <MapControls />
            <MapViewInteractions
              geofencePolygonId={geofencePolygonId}
              selectedTool={selectedTool}
              selectedFeaturesProvider={this._getSelectedTransformableFeatures}
              onAddFeaturesToSelection={this._onAddFeaturesToSelection}
              onAddWaypoint={this._onAddWaypoint}
              onDrawEnded={this._onDrawEnded}
              onFeaturesModified={this._onFeaturesModified}
              onFeaturesTransformed={this._onFeaturesTransformed}
              onNearestFeatureChanged={this._onNearestFeatureChanged}
              onRemoveFeaturesFromSelection={
                this._onRemoveFeaturesFromSelection
              }
              onSetSelectedFeatures={this._onSetSelectedFeatures}
              onSingleFeatureSelected={this._onFeatureSelected}
            />

            {/* OpenLayers interaction that triggers a context menu */}
            <ShowContextMenu
              layers={isLayerVisibleAndSelectable}
              projection='EPSG:4326'
              threshold={40}
              onOpening={this._hideNearestFeatureTooltip}
              selectAction={this._onFeatureSelected}
            >
              {/* The context menu that appears on the map when the user right-clicks */}
              <MapContextMenu />
            </ShowContextMenu>
          </Map>
        </div>
      </NearestItemTooltip>
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
   * Event handler that is called when the user clicks on the map
   * while the "add waypoint" tool is active.
   *
   * @param  {ol.interaction.Draw.Event} event  event dispatched by the draw
   * interaction
   */
  _onAddWaypoint = (event) => {
    const coordinates = event.feature.getGeometry().getCoordinates();
    const [lon, lat] = transform(coordinates, 'EPSG:3857', 'EPSG:4326');
    this.props.dispatch(addNewMissionItem(MissionItemType.GO_TO, { lon, lat }));
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
    const geometry = event.target.getGeometry();
    const extent = geometry.getExtent();
    const features = [];
    const { map } = this._map.current;

    for (const layer of getVisibleSelectableLayers(map)) {
      const source = layer.getSource();
      source.forEachFeatureIntersectingExtent(extent, (feature) => {
        const featureGeometry = feature.getGeometry();
        if (
          featureGeometry.getType() === 'Point' &&
          geometry.intersectsCoordinate(featureGeometry.getCoordinates())
        ) {
          features.push(feature);
        }
      });
    }

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
      const [feature] = createFeaturesFromOpenLayers(event.feature);
      feature.owner = 'user';
      config.map.features.onCreate(feature);
      this.props.dispatch(addFeature(feature));
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Event handler that is called when the user activates a feature by
   * double-clicking on it.
   */
  _onFeatureActivated = (feature) => {
    // Okay, so this was a double-click. If we have a tooltip being shown on
    // the map, show the details dialog of the feature whose tooltip we are
    // showing; otherwise show the details dialog of the given feature.
    this.props.dispatch(showDetailsForFeatureInTooltipOrGivenFeature(feature));
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
    this._updateFeatures(event.features.getArray(), { type: 'modify', event });
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
    if (event.hasMoved) {
      this._updateFeatures(event.features, { type: 'transform', event });
    }
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

    switch (mode) {
      case 'activate':
        this._onFeatureActivated(feature);
        break;

      case 'clear':
        mode = 'set';
        feature = undefined;
        break;

      default:
        break;
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
      add: addToSelection,
      remove: removeFromSelection,
      set: setSelection,
      toggle: toggleInSelection,
    };
    const action = actionMapping[mode] || setSelection;
    const ids = features ? features.map((feature) => feature.getId()) : [];
    if (action === setSelection || (ids && ids.length > 0)) {
      this.props.dispatch(action(ids));
    }
  };

  /**
   * Event handler that is called when the user moves the map view. Synchronizes
   * the state of the map view back to the state store.
   */
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

  _onNearestFeatureChanged = (feature) => {
    this.props.dispatch(
      setFeatureIdForTooltip(feature ? feature.getId() : null)
    );
  };

  _hideNearestFeatureTooltip = () => {
    this.props.dispatch(setFeatureIdForTooltip(null));
  };

  /**
   * Common implementation for `_onFeaturesTransformed` and `_onFeaturesModified`.
   *
   * @param  {ol.Feature[]}  features  the features that are to be updated
   */
  _updateFeatures(features, options) {
    handleFeatureUpdatesInOpenLayers(features, this.props.dispatch, options);
  }

  /**
   * Method to disable the browsers default context menu.
   */
  _disableDefaultContextMenu = () => {
    const { map } = this._map.current;
    map.getViewport().addEventListener('contextmenu', (event) => {
      event.preventDefault();
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
    center: getMapViewCenterPosition(state),
    rotation: getMapViewRotationAngle(state),
    zoom: getMapViewZoom(state),

    geofencePolygonId: getGeofencePolygonId(state),

    selectedFeatures: getSelectedFeatureIds(state),
    selectedTool: getSelectedTool(state),
    selection: getSelection(state),

    uavDetailsPanelFollowsSelection:
      getFollowMapSelectionInUAVDetailsPanel(state),
  })
)(MapViewPresentation);

export default MapView;
