import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import React from 'react';

import {
  layerComponents,
  layerSettingsComponents,
} from '~/components/map/layers';
import { LayerType } from '~/model/layers';

import { BeaconsLayer } from './beacons';
import { DocksLayer } from './docks';
import { FeaturesLayer } from './features';
import { GeoJSONLayer, GeoJSONLayerSettings } from './geojson';
import { HeatmapLayer, HeatmapLayerSettings } from './heatmap';
import { HexGridLayer, HexGridLayerSettings } from './hexgrid';
import { ImageLayer, ImageLayerSettings } from './image';
import { MissionInfoLayer, MissionInfoLayerSettings } from './mission-info';
import { OwnLocationLayer, OwnLocationLayerSettings } from './ownlocation';
import { UAVsLayer, UAVsLayerSettings } from './uavs';
import { UAVTraceLayer, UAVTraceLayerSettings } from './uavtrace';
import { UntypedLayer, UntypedLayerSettings } from './untyped';

const UnavailableLayerSettings = () => (
  <div key='_hint' style={{ position: 'relative', height: 48 }}>
    <BackgroundHint
      text='This layer is unavailable under the license of the
            currently connected server.'
    />
  </div>
);

export const LayerSettings = {
  ...layerSettingsComponents,
  [LayerType.GEOJSON]: GeoJSONLayerSettings,
  [LayerType.HEATMAP]: HeatmapLayerSettings,
  [LayerType.HEXGRID]: HexGridLayerSettings,
  [LayerType.IMAGE]: ImageLayerSettings,
  [LayerType.MISSION_INFO]: MissionInfoLayerSettings,
  [LayerType.OWN_LOCATION]: OwnLocationLayerSettings,
  [LayerType.UAVS]: UAVsLayerSettings,
  [LayerType.UAV_TRACE]: UAVTraceLayerSettings,
  [LayerType.UNTYPED]: UntypedLayerSettings,
};

export const stateObjectToLayerSettings = (layer, layerId) => {
  if (!(layer.type in LayerSettings)) {
    throw new Error(
      `Cannot render settings for nonexistent layer type (${layer.type}).`
    );
  }

  const CurrentLayerSettings = LayerSettings[layer.type];
  return (
    <CurrentLayerSettings
      key={`${layerId}_settings`}
      layer={layer}
      layerId={layerId}
    />
  );
};

export const Layers = {
  ...layerComponents,
  [LayerType.BEACONS]: BeaconsLayer,
  [LayerType.DOCKS]: DocksLayer,
  [LayerType.FEATURES]: FeaturesLayer,
  [LayerType.GEOJSON]: GeoJSONLayer,
  [LayerType.HEATMAP]: HeatmapLayer,
  [LayerType.HEXGRID]: HexGridLayer,
  [LayerType.IMAGE]: ImageLayer,
  [LayerType.MISSION_INFO]: MissionInfoLayer,
  [LayerType.OWN_LOCATION]: OwnLocationLayer,
  [LayerType.UAVS]: UAVsLayer,
  [LayerType.UAV_TRACE]: UAVTraceLayer,
  [LayerType.UNTYPED]: UntypedLayer,
};
