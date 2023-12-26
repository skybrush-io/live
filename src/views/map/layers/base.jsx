import MVTFormat from 'ol/format/MVT';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import { layer as olLayer, source } from '@collmot/ol-react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import { selectMapSource } from '~/features/map/layers';
import { isMapCachingEnabled } from '~/features/map-caching/selectors';
import { getServerUrl, supportsMapCaching } from '~/features/servers/selectors';
import { getAPIKeys } from '~/features/settings/selectors';
import {
  Source,
  Sources,
  attributionsForSource,
  labelForSource,
} from '~/model/sources';
import { streetsV6Style } from '~/views/map/styles/mapbox';

// === Settings for this particular layer type ===

const BaseLayerSettingsPresentation = ({ layer, onLayerSourceChanged }) => {
  const sourceRadioButtons = Sources.map((source) => (
    <FormControlLabel
      key={source}
      value={source}
      label={labelForSource(source)}
      style={{ marginTop: 5 }}
      control={<Radio />}
    />
  ));
  return (
    <RadioGroup
      key='baseProperties'
      name='source.base'
      value={layer.parameters.source}
      onChange={onLayerSourceChanged}
    >
      {sourceRadioButtons}
    </RadioGroup>
  );
};

BaseLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  onLayerSourceChanged: PropTypes.func,
};

export const BaseLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerSourceChanged(_event, value) {
      dispatch(selectMapSource({ layerId: ownProps.layerId, source: value }));
    },
  })
)(BaseLayerSettingsPresentation);

// === The actual layer to be rendered ===

const mvtFormat = new MVTFormat();

const LayerType = ({ children, type, zIndex }) => {
  switch (type) {
    case Source.MAPBOX.VECTOR:
    case Source.NEXTZEN:
      return (
        <olLayer.VectorTile declutter style={streetsV6Style} zIndex={zIndex}>
          {children}
        </olLayer.VectorTile>
      );

    /*
    case Source.MAPTILER.BASIC:
      return (
        <olLayer.VectorTile
          declutter
          style={maptilerBasicStyle}
          zIndex={zIndex}
        >
          {children}
        </olLayer.VectorTile>
      );
    */

    default:
      return <olLayer.Tile zIndex={zIndex}>{children}</olLayer.Tile>;
  }
};

LayerType.propTypes = {
  children: PropTypes.node,
  type: PropTypes.string,
  zIndex: PropTypes.number,
};

const LayerSourcePresentation = ({ apiKeys, tileLoadFunction, type }) => {
  const attributions = attributionsForSource(type);

  switch (type) {
    case Source.MAPBOX.STATIC:
      return (
        <source.XYZ
          attributions={attributions}
          tilePixelRatio={2}
          tileSize={512}
          tileLoadFunction={tileLoadFunction}
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${apiKeys.MAPBOX}`}
        />
      );

    case Source.MAPBOX.SATELLITE:
      return (
        <source.XYZ
          attributions={attributions}
          tilePixelRatio={2}
          tileSize={512}
          tileLoadFunction={tileLoadFunction}
          url={`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${apiKeys.MAPBOX}`}
        />
      );

    case Source.MAPBOX.VECTOR:
      // TODO(ntamas): this could be updated to mapbox-streets-v8 once we get
      // a proper styling function for it
      return (
        <source.VectorTile
          attributions={attributions}
          format={mvtFormat}
          tileLoadFunction={tileLoadFunction}
          url={`https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=${apiKeys.MAPBOX}`}
        />
      );

    case Source.MAPTILER.BASIC:
      return (
        <source.XYZ
          tileLoadFunction={tileLoadFunction}
          tilePixelRatio={2}
          tileSize={512}
          url={`https://api.maptiler.com/maps/basic/{z}/{x}/{y}@2x.png?key=${apiKeys.MAPTILER}`}
        />
      );

    case Source.MAPTILER.HYBRID:
      return (
        <source.XYZ
          tileLoadFunction={tileLoadFunction}
          tilePixelRatio={2}
          tileSize={512}
          url={`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}@2x.jpg?key=${apiKeys.MAPTILER}`}
        />
      );

    case Source.MAPTILER.SATELLITE:
      // This tile source does not seem to have a @2x version
      return (
        <source.XYZ
          tileLoadFunction={tileLoadFunction}
          tileSize={512}
          url={`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${apiKeys.MAPTILER}`}
        />
      );

    case Source.MAPTILER.STREETS:
      return (
        <source.XYZ
          tileLoadFunction={tileLoadFunction}
          tilePixelRatio={2}
          tileSize={512}
          url={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}@2x.png?key=${apiKeys.MAPTILER}`}
        />
      );

    case Source.NEXTZEN:
      // TODO(ntamas): this is not quite ready; the Mapbox styling function does
      // not work for it and we don't have a Nextzen-specific styling function
      return (
        <source.VectorTile
          attributions={attributions}
          format={mvtFormat}
          maxZoom={16}
          tileLoadFunction={tileLoadFunction}
          url={`https://tile.nextzen.org/tilezen/vector/v1/512/all/{z}/{x}/{y}.mvt?api_key=${apiKeys.NEXTZEN}`}
        />
      );

    case Source.OSM:
      return (
        <source.OSM
          tileLoadFunction={tileLoadFunction}
          url='https://{a-c}.tile.skybrush.io/osm/{z}/{x}/{y}.png'
        />
      );

    case Source.STAMEN.TERRAIN:
      return (
        <source.StadiaMaps
          tileLoadFunction={tileLoadFunction}
          layerName='stamen_terrain'
        />
      );

    case Source.STAMEN.TONER:
      return (
        <source.StadiaMaps
          tileLoadFunction={tileLoadFunction}
          layerName='stamen_toner'
        />
      );

    case Source.STAMEN.WATERCOLOR:
      return (
        <source.StadiaMaps
          tileLoadFunction={tileLoadFunction}
          layerName='stamen_watercolor'
        />
      );

    case Source.GOOGLE.DEFAULT:
      return (
        <source.XYZ
          tileLoadFunction={tileLoadFunction}
          url='https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}'
        />
      );

    case Source.GOOGLE.SATELLITE:
      return (
        <source.XYZ
          tileLoadFunction={tileLoadFunction}
          url='https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        />
      );

    case Source.BING.AERIAL_WITH_LABELS:
      return (
        <source.BingMaps
          apiKey={apiKeys.BING}
          imagerySet='AerialWithLabels'
          maxZoom={19}
        />
      );

    case Source.BING.ROAD:
      return <source.BingMaps apiKey={apiKeys.BING} imagerySet='Road' />;

    default:
      return null;
  }
};

LayerSourcePresentation.propTypes = {
  apiKeys: PropTypes.object,
  tileLoadFunction: PropTypes.func,
  type: PropTypes.string,
};

/**
 * Default tile loader function that loads a tile from the given URL and assigns
 * it to the given image tile.
 */
function loadTile(imageTile, url) {
  imageTile.getImage().src = url;
}

/**
 * Function that takes the URL of the server, and returns another function that
 * loads tiles into an OpenLayers layer in a way that passes through the
 * server caches.
 */
function getCachedTileLoader(serverUrl) {
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
  getServerUrl,
  (cachingEnabled, cachingSupported, serverUrl) =>
    cachingEnabled && cachingSupported
      ? getCachedTileLoader(serverUrl)
      : loadTile
);

const LayerSource = connect(
  // mapStateToProps
  (state) => ({
    apiKeys: getAPIKeys(state),
    tileLoadFunction: getMapTileLoaderFunction(state),
  }),
  // mapDispatchToProps
  {}
)(LayerSourcePresentation);

export const BaseLayer = ({ layer, zIndex }) => (
  <LayerType type={layer.parameters.source} zIndex={zIndex}>
    <LayerSource type={layer.parameters.source} />
  </LayerType>
);

BaseLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};
