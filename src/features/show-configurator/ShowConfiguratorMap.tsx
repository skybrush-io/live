import {
  type ActionCreatorWithoutPayload,
  type ActionCreatorWithPayload,
} from '@reduxjs/toolkit';
import Feature from 'ol/Feature';
import type OLMap from 'ol/Map';
import type Point from 'ol/geom/Point';
import type { DragBoxEvent } from 'ol/interaction/DragBox';
import type { ModifyEvent } from 'ol/interaction/Modify';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';

import ToolbarDivider from '~/components/ToolbarDivider';
import UndoRedoButtons from '~/components/UndoRedoButtons';
import Colors from '~/components/colors';
import { Map, MapToolbars } from '~/components/map';
import { type ViewProperties } from '~/components/map/Map';
import type { MapControlDisplaySettings } from '~/components/map/MapControls';
import MapRotationTextBox from '~/components/map/MapRotationTextBox';
import MapInteractions from '~/components/map/interactions/MapInteractions';
import type {
  BoxDragMode,
  FeatureSelectionMode,
  FeatureSelectionOrActivationMode,
} from '~/components/map/interactions/types';
import {
  layerComponents as defaultLayerComponent,
  type LayerConfig,
  type LayerProps,
} from '~/components/map/layers';
import ShowInfoLayerPresentation, {
  convexHullPolygon,
  ConvexHullVariant,
  homePositionPoints,
  landingPositionPoints,
  orientationMarker,
} from '~/components/map/layers/ShowInfoLayer';
import { FeaturesLayer } from '~/components/map/layers/features';
import { UAVsLayer, type UAVsLayerProps } from '~/components/map/layers/uavs';
import { noMark } from '~/components/map/layers/utils';
import { Tool } from '~/components/map/tools';
import { type GPSPosition } from '~/model/geography';
import {
  globalIdToAreaId,
  GROSS_CONVEX_HULL_AREA_ID,
  isHomePositionId,
  NET_CONVEX_HULL_AREA_ID,
} from '~/model/identifiers';
import { getVisibleSelectableLayers, LayerType } from '~/model/layers';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { findFeaturesById } from '~/utils/geography';
import { EMPTY_ARRAY } from '~/utils/redux';
// TODO(vp): try to move or generalize this component
// to get rid of the `~/views` import.
import ActiveUAVsLayerSource from '~/views/map/sources/ActiveUAVsLayerSource';

import { type FeatureUpdateOptions, updateModifiedFeatures } from './actions';
import {
  type ConvexHullMarkerData,
  getCenterOfShowConfiguratorHomePositionsAsLonLat,
  getConvexHullOfShowInWorldCoordinates,
  getFutureHistoryLength,
  getHomePositionsInWorldCoordinates,
  getPastHistoryLength,
  getSelection,
  getVisibleLayersInOrder,
  selectApproximateConvexHullOfFullShowInWorldCoordinates,
  selectConvexHullMarkerData,
} from './selectors';
import {
  historyJump,
  historyRedo,
  historyUndo,
  updateSelection,
} from './state';

// === Layers ===

type ShowInfoLayerProps = LayerProps &
  Readonly<{
    approximateConvexHullOfFullShow?: GPSPosition[];
    convexHull?: GPSPosition[];
    convexHullMarker: ConvexHullMarkerData | undefined;
    homePositions?: Array<GPSPosition | undefined>;
    landingPositions?: Array<GPSPosition | undefined>;
    selection: Identifier[];
  }>;

const ShowInfoLayer = (props: ShowInfoLayerProps): React.JSX.Element => {
  const {
    approximateConvexHullOfFullShow,
    convexHull,
    convexHullMarker,
    homePositions,
    landingPositions,
    selection,
    ...layerProps
  } = props;

  return (
    <ShowInfoLayerPresentation {...layerProps}>
      {convexHullMarker &&
        orientationMarker(
          convexHullMarker.orientation,
          convexHullMarker.origin,
          'show-orientation',
          Colors.netShowConvexHull
        )}
      {convexHullPolygon(
        approximateConvexHullOfFullShow,
        selection,
        ConvexHullVariant.GROSS
      )}
      {homePositionPoints(homePositions, { selection }, { hideLabels: true })}
      {landingPositionPoints(
        landingPositions,
        { selection },
        { hideLabels: true }
      )}
      {convexHullPolygon(convexHull, selection, ConvexHullVariant.NET)}
    </ShowInfoLayerPresentation>
  );
};

const ConnectedShowInfoLayer = connect((state: RootState) => ({
  approximateConvexHullOfFullShow:
    selectApproximateConvexHullOfFullShowInWorldCoordinates(state),
  convexHull: getConvexHullOfShowInWorldCoordinates(state),
  convexHullMarker: selectConvexHullMarkerData(state),
  homePositions: getHomePositionsInWorldCoordinates(state),
  // landingPositions: getLandingPositionsInWorldCoordinates(state),
  selection: getSelection(state),
}))(ShowInfoLayer);

// === Map ===

const layerComponents: Partial<
  Record<LayerType, React.ComponentType<LayerProps>>
> = {
  ...defaultLayerComponent,
  [LayerType.FEATURES]: (props: LayerProps) => (
    <FeaturesLayer {...props} layerRefHandler={noMark} />
  ),
  [LayerType.MISSION_INFO]: ConnectedShowInfoLayer,
  [LayerType.UAVS]: (
    props: Omit<UAVsLayerProps, 'LayerSource' | 'selection'>
  ) => (
    <UAVsLayer
      {...props}
      labelHidden
      LayerSource={ActiveUAVsLayerSource}
      selection={EMPTY_ARRAY}
    />
  ),
};

const mapControlSettings: Partial<MapControlDisplaySettings> = {
  showAttribution: false,
  showMouseCoordinates: false,
  showScaleLine: false,
};

type MapProps = Readonly<{
  defaultPosition?: ViewProperties['position'];
  futureHistoryLength: number;
  historyJump: ActionCreatorWithPayload<number>;
  historyRedo: ActionCreatorWithoutPayload;
  historyUndo: ActionCreatorWithoutPayload;
  layers: LayerConfig['layers'];
  pastHistoryLength: number;
  selectedTool: Tool;
  selection: Identifier[];
  updateModifiedFeatures: (
    features: Feature[],
    options: FeatureUpdateOptions
  ) => void;
  updateSelection: (mode: FeatureSelectionMode, ids: Identifier[]) => void;
}>;

 
const useOwnState = (props: MapProps) => {
  const { selection, updateModifiedFeatures, updateSelection } = props;

  const getSelectedTransformableFeatures = useCallback(
    (map: OLMap): Feature[] => {
      return findFeaturesById(map, selection).filter((val): val is Feature => {
        if (!(val instanceof Feature)) {
          return false;
        }

        const id = val.getId();
        if (typeof id !== 'string') {
          return false;
        }

        const areaId = globalIdToAreaId(id);
        return (
          // Convex hull is transformable.
          areaId === NET_CONVEX_HULL_AREA_ID ||
          // Convex hull (incl. home positions) is transformable.
          areaId === GROSS_CONVEX_HULL_AREA_ID ||
          // Home positions are transformable
          isHomePositionId(id)
        );
      });
    },
    [selection]
  );

  const onFeaturesSelected = useCallback(
    (
      mode: FeatureSelectionOrActivationMode,
      features: Feature[] | undefined
    ) => {
      if (mode === 'activate') {
        return; // Not supported.
      }

      const ids = features
        ? features
            .map((feature) => feature.getId()?.toString())
            .filter((v) => v !== undefined)
        : [];
      if (mode === 'set' || (ids && ids.length > 0)) {
        updateSelection(mode, ids);
      }
    },
    [updateSelection]
  );

  const onBoxDragEnded = useCallback(
    (mode: BoxDragMode, event: DragBoxEvent) => {
      const target: Feature = event.target as Feature;
      const geometry = target.getGeometry();
      if (geometry === undefined) {
        return;
      }

      const extent = geometry.getExtent();
      const features: Feature[] = [];
      const map = event.mapBrowserEvent.map;

      for (const layer of getVisibleSelectableLayers(map)) {
        if (!(layer instanceof VectorLayer)) {
          continue;
        }

        const source: VectorSource = layer.getSource() as VectorSource;
        if (!source) {
          continue;
        }

        source.forEachFeatureIntersectingExtent(extent, (feature) => {
          const featureGeometry = feature.getGeometry();
          if (
            featureGeometry?.getType() === 'Point' &&
            geometry.intersectsCoordinate(
              (featureGeometry as Point).getCoordinates()
            )
          ) {
            features.push(feature);
          }
        });
      }

      onFeaturesSelected(mode, features);
    },
    [onFeaturesSelected]
  );

  const onSingleFeatureSelected = useCallback(
    (mode: FeatureSelectionOrActivationMode, feature: Feature | undefined) => {
      if (mode === 'activate') {
        // Not supported here.
        return;
      }

      const id = feature ? feature.getId() : undefined;
      if (id === undefined && mode !== 'set' && mode !== 'clear') {
        return;
      }

      if (mode === 'clear') {
        mode = 'set';
        feature = undefined;
      }

      onFeaturesSelected(mode, feature ? [feature] : []);
    },
    [onFeaturesSelected]
  );

  const onFeaturesModified = useCallback(
    (event: ModifyEvent) => {
      updateModifiedFeatures(event.features.getArray(), {
        type: 'modify',
        event,
      });
    },
    [updateModifiedFeatures]
  );

  return {
    getSelectedTransformableFeatures,
    onBoxDragEnded,
    onFeaturesModified,
    onSingleFeatureSelected,
    updateModifiedFeatures,
  };
};

const ShowConfiguratorMap = (props: MapProps): React.JSX.Element => {
  const {
    defaultPosition,
    futureHistoryLength,
    historyJump,
    historyRedo,
    historyUndo,
    layers,
    pastHistoryLength,
    selectedTool,
  } = props;
  const {
    getSelectedTransformableFeatures,
    onBoxDragEnded,
    onFeaturesModified,
    onSingleFeatureSelected,
    updateModifiedFeatures,
  } = useOwnState(props);

  const mapLayers = useMemo(() => ({ layers, layerComponents }), [layers]);

  return (
    <Map
      id='adapt-map-view'
      position={defaultPosition}
      selectedTool={selectedTool}
      layers={mapLayers}
      controlSettings={mapControlSettings}
      onFeaturesModified={onFeaturesModified}
    >
      <MapToolbars
        top={
          <>
            <MapRotationTextBox resetDuration={500} fieldWidth='75px' />
            <ToolbarDivider orientation='vertical' />
            <UndoRedoButtons
              canDiscard={pastHistoryLength > 0}
              canUndo={pastHistoryLength > 0}
              canRedo={futureHistoryLength > 0}
              tooltipPlacement='bottom'
              undo={() => historyUndo()}
              redo={() => historyRedo()}
              discard={() => historyJump(-pastHistoryLength)}
            />
          </>
        }
      />
      <MapInteractions
        selectedTool={selectedTool}
        getSelectedTransformableFeatures={getSelectedTransformableFeatures}
        updateModifiedFeatures={updateModifiedFeatures}
        onBoxDragEnded={onBoxDragEnded}
        onSingleFeatureSelected={onSingleFeatureSelected}
      />
    </Map>
  );
};

const ConnectedShowConfiguratorMap = connect(
  // mapStateToProps
  (state: RootState) => ({
    defaultPosition: getCenterOfShowConfiguratorHomePositionsAsLonLat(state),
    futureHistoryLength: getFutureHistoryLength(state),
    layers: getVisibleLayersInOrder(state),
    pastHistoryLength: getPastHistoryLength(state),
    selectedTool: Tool.SELECT,
    selection: getSelection(state),
  }),
  // mapDispatchToProps
  {
    historyJump,
    historyRedo,
    historyUndo,
    updateModifiedFeatures,
    updateSelection,
  }
)(ShowConfiguratorMap);

export default ConnectedShowConfiguratorMap;
