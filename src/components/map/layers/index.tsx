import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import React from 'react';

import { LayerType } from '~/model/layers';
import { BaseLayer, BaseLayerSettings } from './base';
import { GraticuleLayer } from './graticule';
import type { LayerProps } from './MapLayers';
import { TileServerLayer, TileServerLayerSettings } from './tile-server';
export { MapLayers, type LayerConfig } from './MapLayers';

export type { LayerProps };

export const UnavailableLayerSettings = () => (
  <div key='_hint' style={{ position: 'relative', height: 48 }}>
    <BackgroundHint
      text='This layer is unavailable under the license of the
            currently connected server.'
    />
  </div>
);

export const layerSettingsComponents = {
  [LayerType.BASE]: BaseLayerSettings,
  [LayerType.TILE_SERVER]: TileServerLayerSettings,
  [LayerType.UNAVAILABLE]: UnavailableLayerSettings,
};

export const layerComponents: Partial<
  Record<LayerType, React.ComponentType<LayerProps>>
> = {
  [LayerType.BASE]: BaseLayer,
  [LayerType.GRATICULE]: GraticuleLayer,
  [LayerType.TILE_SERVER]: TileServerLayer as any,
};
