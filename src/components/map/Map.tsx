import type { ModifyEvent } from 'ol/interaction/Modify';
import React, { useMemo, type CSSProperties } from 'react';
import { connect } from 'react-redux';

// @ts-expect-error
import { View } from '@collmot/ol-react';

import {
  getMapViewCenterPosition,
  getMapViewRotationAngle,
  getMapViewZoom,
} from '~/selectors/map';
import { RootState } from '~/store/reducers';
import { mapViewCoordinateFromLonLat, type LonLat } from '~/utils/geography';

import BaseMap from './BaseMap';
import { MapLayers, type LayerConfig } from './layers';
import MapControls, { type MapControlDisplaySettings } from './MapControls';
import { Tool } from './tools';

export const styles: Record<'map' | 'mapWrapper', CSSProperties> = {
  map: {
    // Vector tile based maps assume that there is a light background
    background: '#f8f4f0',
    height: '100%',
  },
  mapWrapper: {
    height: '100%',
    // For correct toolbar positioning.
    position: 'relative',
  },
};

export const toolClasses: Partial<Record<Tool, string>> = {
  [Tool.SELECT]: 'tool-select',
  [Tool.ZOOM]: 'tool-zoom',
  [Tool.PAN]: 'tool-pan',
  [Tool.DRAW_POINT]: 'tool-draw tool-draw-point',
  [Tool.DRAW_CIRCLE]: 'tool-draw tool-draw-circle',
  [Tool.DRAW_RECTANGLE]: 'tool-draw tool-draw-rectangle',
  [Tool.DRAW_PATH]: 'tool-draw tool-draw-path',
  [Tool.DRAW_POLYGON]: 'tool-draw tool-draw-polygon',
  [Tool.CUT_HOLE]: 'tool-edit tool-cut-hole',
  [Tool.EDIT_FEATURE]: 'tool-edit tool-edit-feature',
};

export type ViewProperties = {
  angle: number;
  position: LonLat;
  zoom: number;
};

type MapProps = Partial<ViewProperties> & {
  children?: React.ReactNode;
  mainMapViewProperties: ViewProperties;

  // -- Layer configuration
  layers: LayerConfig;

  // -- Selection
  selectedTool: Tool;

  // -- Controls
  controlSettings?: Partial<MapControlDisplaySettings>;

  // -- Callbacks
  onMapMoved?: () => void;

  /**
   * The `ModifyEvent` handler the layers should use.
   */
  onFeaturesModified?: (event: ModifyEvent) => void;

  // -- Ids and refs.
  id?: string;
  mapRef?: React.Ref<typeof BaseMap>;
};

const Map = (props: MapProps) => {
  const {
    children,
    mainMapViewProperties,
    angle = mainMapViewProperties.angle,
    position = mainMapViewProperties.position,
    zoom = mainMapViewProperties.zoom,
    selectedTool,
    controlSettings = {},
    layers,
    onFeaturesModified,
    onMapMoved,
    id,
    mapRef,
  } = props;

  const view = useMemo(
    () => (
      <View
        center={mapViewCoordinateFromLonLat(position)}
        rotation={(-angle * Math.PI) / 180}
        zoom={zoom}
        maxZoom={24}
        constrainRotation={false}
      />
    ),
    [angle, position, zoom]
  );

  return (
    <div style={styles.mapWrapper}>
      <BaseMap
        id={id}
        ref={mapRef}
        loadTilesWhileInteracting
        view={view}
        useDefaultControls={false}
        className={toolClasses[selectedTool]}
        style={styles.map}
        onMoveEnd={onMapMoved}
      >
        <MapLayers
          {...layers}
          selectedTool={selectedTool}
          onFeaturesModified={onFeaturesModified}
        />
        <MapControls {...controlSettings} />
        {children}
      </BaseMap>
    </div>
  );
};

const ConnectedMap = connect((state: RootState) => ({
  mainMapViewProperties: {
    angle: getMapViewRotationAngle(state),
    position: getMapViewCenterPosition(state),
    zoom: getMapViewZoom(state),
  },
}))(Map);

export default ConnectedMap;
