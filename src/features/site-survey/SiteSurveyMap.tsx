import Feature from 'ol/Feature';
import type OLMap from 'ol/Map';
import type Point from 'ol/geom/Point';
import type { DragBoxEvent } from 'ol/interaction/DragBox';
import type { ModifyEvent } from 'ol/interaction/Modify';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import Colors from '~/components/colors';
import { Map } from '~/components/map';
import type { MapControlDisplaySettings } from '~/components/map/MapControls';
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
import type { AppDispatch, RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { findFeaturesById } from '~/utils/geography';
import { EMPTY_ARRAY } from '~/utils/redux';
// TODO(vp): try to move or generalize this component
// to get rid of the `~/views` import.
import ActiveUAVsLayerSource from '~/views/map/sources/ActiveUAVsLayerSource';

import {
  updateModifiedFeatures as updateModifiedFeaturesAction,
  type FeatureUpdateOptions,
} from './actions';
import {
  getConvexHullOfShowInWorldCoordinates,
  getHomePositionsInWorldCoordinates,
  getSelection,
  getVisibleLayersInOrder,
  selectApproximateConvexHullOfFullShowInWorldCoordinates,
  selectConvexHullMarkerData,
  type ConvexHullMarkerData,
} from './selectors';
import { updateSelection } from './state';

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

const ShowInfoLayer = (props: ShowInfoLayerProps): JSX.Element => {
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
  showMouseCoordinates: false,
  showScaleLine: false,
};

type SiteSurveyMapProps = Readonly<{
  layers: LayerConfig['layers'];
  selectedTool: Tool;
  updateModifiedFeatures: (
    features: Feature[],
    options: FeatureUpdateOptions
  ) => void;
  updateSelection: (mode: FeatureSelectionMode, ids: Identifier[]) => void;
  selection: Identifier[];
}>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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

const SiteSurveyMap = (props: SiteSurveyMapProps): JSX.Element => {
  const { layers, selectedTool } = props;
  const {
    getSelectedTransformableFeatures,
    onBoxDragEnded,
    onFeaturesModified,
    onSingleFeatureSelected,
    updateModifiedFeatures,
  } = useOwnState(props);
  return (
    <Map
      selectedTool={selectedTool}
      layers={{ layers, layerComponents }}
      controlSettings={mapControlSettings}
      onFeaturesModified={onFeaturesModified}
    >
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

const ConnectedSiteSurveyMap = connect(
  // mapStateToProps
  (state: RootState) => ({
    layers: getVisibleLayersInOrder(state),
    selectedTool: Tool.SELECT,
    selection: getSelection(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    updateSelection(mode: FeatureSelectionMode, ids: Identifier[]): void {
      dispatch(updateSelection({ mode, ids }));
    },
    updateModifiedFeatures(
      features: Feature[],
      options: FeatureUpdateOptions
    ): void {
      updateModifiedFeaturesAction(dispatch, features, options);
    },
  })
)(SiteSurveyMap);

export default ConnectedSiteSurveyMap;
