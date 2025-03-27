import Feature from 'ol/Feature';
import type { ModifyEvent } from 'ol/interaction/Modify';
import React, { useCallback } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
// Import from ol/Map because that one has typing.
import type OLMap from 'ol/Map';
import type { DragBoxEvent } from 'ol/interaction/DragBox';
import VectorLayer from 'ol/layer/Vector';

import { Map } from '~/components/map';
import { PlaceTakeoffGrid } from '~/components/map/interactions';
import MapInteractions from '~/components/map/interactions/MapInteractions';
import type {
  BoxDragMode,
  FeatureSelectionMode,
  FeatureSelectionOrActivationMode,
} from '~/components/map/interactions/types';
import {
  layerComponents as defaultLayerComponent,
  LayerProps,
  type LayerConfig,
} from '~/components/map/layers';
import ShowInfoLayerPresentation, {
  convexHullPolygon,
  homePositionPoints,
  landingPositionPoints,
} from '~/components/map/layers/ShowInfoLayer';
import { Tool } from '~/components/map/tools';
import Widget from '~/components/Widget';
import { getCenteredTakeoffGrid, getSelectedTool } from '~/features/map/tools';
import {
  updateModifiedFeatures as updateModifiedFeaturesAction,
  type FeatureUpdateOptions,
} from '~/features/site-survey/actions';
import {
  getConvexHullOfShowInWorldCoordinates,
  getHomePositionsInWorldCoordinates,
  getSelection,
} from '~/features/site-survey/selectors';
import {
  updateSelection,
  updateHomePositions,
} from '~/features/site-survey/state';
import {
  CONVEX_HULL_AREA_ID,
  isAreaId,
  isHomePositionId,
} from '~/model/identifiers';
import { getVisibleSelectableLayers, LayerType } from '~/model/layers';
import { getVisibleLayersInOrder } from '~/selectors/ordered';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { findFeaturesById } from '~/utils/geography';
import type { WorldCoordinate2D } from '~/utils/math';
import TakeoffToolbar from '~/views/map/TakeoffToolbar';
import type { MapControlDisplaySettings } from '~/components/map/MapControls';

// === Layers ===

type ShowInfoLayerProps = LayerProps & {
  convexHull?: WorldCoordinate2D[];
  homePositions?: (WorldCoordinate2D | undefined)[];
  landingPositions?: (WorldCoordinate2D | undefined)[];
  selection: Identifier[];
};

const ShowInfoLayer = (props: ShowInfoLayerProps) => {
  const {
    convexHull,
    homePositions,
    landingPositions,
    selection,
    ...layerProps
  } = props;

  return (
    <ShowInfoLayerPresentation {...layerProps}>
      {...homePositionPoints(homePositions, selection)}
      {...landingPositionPoints(landingPositions, selection)}
      {...convexHullPolygon(convexHull, selection)}
    </ShowInfoLayerPresentation>
  );
};

const ConnectedShowInfoLayer = connect((state: RootState) => ({
  convexHull: getConvexHullOfShowInWorldCoordinates(state),
  homePositions: getHomePositionsInWorldCoordinates(state),
  // landingPositions: getLandingPositionsInWorldCoordinates(state),
  selection: getSelection(state),
}))(ShowInfoLayer);

// === Map ===

const layerComponents = {
  ...defaultLayerComponent,
  [LayerType.MISSION_INFO]: ConnectedShowInfoLayer,
};

const mapControlSettings: Partial<MapControlDisplaySettings> = {
  showMouseCoordinates: false,
  showScaleLine: false,
};

type SiteSurveyMapProps = {
  layers: LayerConfig['layers'];
  selectedTool: Tool;
  updateModifiedFeatures: (
    features: Feature[],
    options: FeatureUpdateOptions
  ) => void;
  updateSelection: (mode: FeatureSelectionMode, ids: Identifier[]) => void;
  selection: Identifier[];
};

const useOwnState = (props: SiteSurveyMapProps) => {
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
        return (
          (isAreaId(id) && id.endsWith(CONVEX_HULL_AREA_ID)) || // Convex hull is transformable.
          isHomePositionId(id) // Home positions are transformable
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
      const target: Feature = event.target;
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

        const source = layer.getSource();
        if (!source) {
          continue;
        }

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

const SiteSurveyMap = (props: SiteSurveyMapProps) => {
  const { layers, selectedTool } = props;
  const {
    getSelectedTransformableFeatures,
    onBoxDragEnded,
    onFeaturesModified,
    onSingleFeatureSelected,
    updateModifiedFeatures,
  } = useOwnState(props);
  const takeoffGrid = useSelector(getCenteredTakeoffGrid);
  const dispatch = useDispatch();
  return (
    <Map
      selectedTool={selectedTool}
      layers={{ layers, layerComponents }}
      onFeaturesModified={onFeaturesModified}
      controlSettings={mapControlSettings}
    >
      <Widget
        key='Widget.TakeoffToolbar'
        style={{ top: 8, left: '50%', transform: 'translateX(-50%)' }}
        showControls={false}
      >
        <TakeoffToolbar />
      </Widget>
      <MapInteractions
        selectedTool={selectedTool}
        getSelectedTransformableFeatures={getSelectedTransformableFeatures}
        onBoxDragEnded={onBoxDragEnded}
        onSingleFeatureSelected={onSingleFeatureSelected}
        updateModifiedFeatures={updateModifiedFeatures}
      />
      {selectedTool === Tool.TAKEOFF_GRID && (
        <PlaceTakeoffGrid
          takeoffGrid={takeoffGrid}
          updateHomePositions={
            // @ts-ignore
            (...args) => dispatch(updateHomePositions(...args))
          }
        />
      )}
    </Map>
  );
};

const ConnectedSiteSurveyMap = connect(
  // mapStateToProps
  (state: RootState) => ({
    layers: getVisibleLayersInOrder(state),
    selectedTool: getSelectedTool(state),
    selection: getSelection(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    updateSelection: (mode: FeatureSelectionMode, ids: Identifier[]) =>
      dispatch(updateSelection({ mode, ids })),
    updateModifiedFeatures: (
      features: Feature[],
      options: FeatureUpdateOptions
    ) => updateModifiedFeaturesAction(dispatch, features, options),
  })
)(SiteSurveyMap);

export default ConnectedSiteSurveyMap;
