import type { ModifyEvent } from 'ol/interaction/Modify';
import React, { useMemo, type CSSProperties } from 'react';

// @ts-ignore
import { Map as OLMap, View } from '@collmot/ol-react';

import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import type { Coordinate2D } from '~/utils/math';
import { MapLayers, type LayerConfig } from './layers';
import MapControls from './MapControls';
import MapToolbars from './MapToolbars';
import { Tool } from './tools';

import 'ol/ol.css';

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

type ViewProperties = {
  center: Coordinate2D;
  zoom: number;
  rotation: number;
};

export const viewDefaults: ViewProperties = {
  center: [19.061951, 47.47334],
  zoom: 17,
  rotation: 0,
};

type MapProps = Partial<ViewProperties> & {
  // -- Layer configuration
  layers: LayerConfig;

  // -- Selection
  selectedTool: Tool;

  // -- Toolbar

  toolbarEnabled?: boolean;

  // -- Callbacks
  onMapMoved?: () => void;

  /**
   * The `ModifyEvent` handler the layers should use.
   */
  onFeaturesModified?: (event: ModifyEvent) => void;

  // -- Ids and refs.
  id?: string;
  mapRef?: React.Ref<OLMap>;
};

const Map = (props: MapProps) => {
  const {
    center = viewDefaults.center,
    rotation = viewDefaults.rotation,
    zoom = viewDefaults.zoom,
    selectedTool,
    // TODO(vp): disabled by default, because apparently one of the buttons in
    // the toolbar keeps a reference to the map which indicates a memory leak...
    // It indicates that maps are still not completely independent of the main
    // map in map view.
    toolbarEnabled = false,
    layers,
    onFeaturesModified,
    onMapMoved,
    id,
    mapRef,
  } = props;

  const view = useMemo(
    () => (
      <View
        center={mapViewCoordinateFromLonLat(center)}
        rotation={(-rotation * Math.PI) / 180}
        zoom={zoom}
        maxZoom={24}
        constrainRotation={false}
      />
    ),
    [center, rotation, zoom]
  );

  return (
    <div style={styles.mapWrapper}>
      <OLMap
        id={id}
        ref={mapRef}
        loadTilesWhileInteracting
        view={view}
        useDefaultControls={false}
        className={toolClasses[selectedTool]}
        style={styles.map}
        onMoveEnd={onMapMoved}
      >
        {toolbarEnabled ? <MapToolbars /> : <></>}
        <MapLayers
          {...layers}
          selectedTool={selectedTool}
          onFeaturesModified={onFeaturesModified}
        />
        <MapControls />
      </OLMap>
    </div>
  );
};

export default Map;
