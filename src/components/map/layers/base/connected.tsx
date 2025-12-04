import { createSelector } from '@reduxjs/toolkit';
import { connect } from 'react-redux';

import { isMapCachingEnabled } from '~/features/map-caching/selectors';
import { selectMapSource } from '~/features/map/layers';
import {
  getServerHttpUrl,
  supportsMapCaching,
} from '~/features/servers/selectors';
import { getAPIKeys } from '~/features/settings/selectors';
import { type Source } from '~/model/sources';
import type { RootState } from '~/store/reducers';

import {
  type BaseLayerProps,
  type BaseLayerSettingsProps,
  type LoadImageTileFunction,
  BaseLayer as BaseLayerPresentation,
  BaseLayerSettings as BaseLayerSettingsPresentation,
  LayerSource as LayerSourcePresentation,
} from './presentation';

// === Settings for this particular layer type ===

export const BaseLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (
    dispatch,
    ownProps: Omit<BaseLayerSettingsProps, 'onLayerSourceChanged'>
  ) => ({
    onLayerSourceChanged(_event: any, value: Source.Source) {
      dispatch(selectMapSource({ layerId: ownProps.layerId, source: value }));
    },
  })
)(BaseLayerSettingsPresentation);

// === The actual layer to be rendered ===

/**
 * Default tile loader function that loads a tile from the given URL and assigns
 * it to the given image tile.
 */
const loadTile: LoadImageTileFunction = (imageTile, url) => {
  const img = imageTile.getImage();
  if (img instanceof HTMLImageElement || img instanceof HTMLVideoElement) {
    img.src = url;
  }
};

/**
 * Function that takes the URL of the server, and returns another function that
 * loads tiles into an OpenLayers layer in a way that passes through the
 * server caches.
 */
function getCachedTileLoader(serverUrl: string): LoadImageTileFunction {
  return (imageTile, url) => {
    const cachedUrl = `${serverUrl}/map-cache/_?url=` + encodeURIComponent(url);
    loadTile(imageTile, cachedUrl);
  };
}

/**
 * Selector that returns a function that takes an image tile and a URL and loads
 * the tile at the given URL to the given image tile, optionally piping it
 * through the map cache of the server.
 */
const getMapTileLoaderFunction = createSelector(
  isMapCachingEnabled,
  supportsMapCaching,
  getServerHttpUrl,
  (cachingEnabled, cachingSupported, serverHttpUrl) =>
    cachingEnabled && cachingSupported && serverHttpUrl
      ? getCachedTileLoader(serverHttpUrl)
      : loadTile
);

const LayerSource = connect(
  // mapStateToProps
  (state: RootState) => ({
    apiKeys: getAPIKeys(state),
    tileLoadFunction: getMapTileLoaderFunction(state),
  }),
  // mapDispatchToProps
  {}
)(LayerSourcePresentation);

export const BaseLayer = ({
  layer,
  zIndex,
}: Omit<BaseLayerProps, 'LayerSource'>) => (
  <BaseLayerPresentation
    layer={layer}
    zIndex={zIndex}
    LayerSource={LayerSource}
  />
);
