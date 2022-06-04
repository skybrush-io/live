import { layer as olLayer, source } from '@collmot/ol-react';
import MVTFormat from 'ol/format/MVT';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import { selectMapSource } from '~/actions/map';
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

const createMapTilerSource = (name, tileSize, apiKey) => (
  <source.TileJSON
    crossOrigin='anonymous'
    tileSize={tileSize}
    url={`https://api.maptiler.com/${name}/tiles.json?key=${apiKey}`}
  />
);

/*
const createMapTilerVectorSource = (apiKey) => (
  <source.VectorTile
    crossOrigin="anonymous"
    format={mvtFormat}
    url={`https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=${apiKey}`}
  />
);
*/

const LayerSource = ({ apiKeys, type }) => {
  const attributions = attributionsForSource(type);

  switch (type) {
    case Source.MAPBOX.STATIC:
      return (
        <source.XYZ
          attributions={attributions}
          tileSize={512}
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/512/{z}/{x}/{y}@2x?access_token=${apiKeys.MAPBOX}`}
        />
      );

    case Source.MAPBOX.SATELLITE:
      return (
        <source.XYZ
          attributions={attributions}
          tileSize={512}
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
          url={`https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=${apiKeys.MAPBOX}`}
        />
      );

    case Source.MAPTILER.BASIC:
      // TODO(ntamas): this would probably look better in vector format; we need
      // a proper styling function for it
      return createMapTilerSource('maps/basic', 512, apiKeys.MAPTILER);

    case Source.MAPTILER.HYBRID:
      // TODO(ntamas): this would probably look better in vector format; we need
      // a proper styling function for it
      return createMapTilerSource('maps/hybrid', 512, apiKeys.MAPTILER);

    case Source.MAPTILER.SATELLITE:
      return createMapTilerSource('tiles/satellite', 256, apiKeys.MAPTILER);

    case Source.MAPTILER.STREETS:
      // TODO(ntamas): this would probably look better in vector format; we need
      // a proper styling function for it
      return createMapTilerSource('maps/streets', 512, apiKeys.MAPTILER);

    case Source.NEXTZEN:
      // TODO(ntamas): this is not quite ready; the Mapbox styling function does
      // not work for it and we don't have a Nextzen-specific styling function
      return (
        <source.VectorTile
          attributions={attributions}
          format={mvtFormat}
          maxZoom={16}
          url={`https://tile.nextzen.org/tilezen/vector/v1/512/all/{z}/{x}/{y}.mvt?api_key=${apiKeys.NEXTZEN}`}
        />
      );

    case Source.OSM:
      return (
        <source.OSM url='https://{a-c}.tile.skybrush.io/osm/{z}/{x}/{y}.png' />
      );

    case Source.STAMEN.TERRAIN:
      return (
        <source.XYZ
          attributions={attributions}
          url='https://stamen-tiles-{a-d}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg'
        />
      );

    case Source.STAMEN.TONER:
      return (
        <source.XYZ
          attributions={attributions}
          url='https://stamen-tiles-{a-d}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
        />
      );

    case Source.STAMEN.WATERCOLOR:
      return (
        <source.XYZ
          attributions={attributions}
          url='https://stamen-tiles-{a-d}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
        />
      );

    case Source.GOOGLE_MAPS.DEFAULT:
      return (
        <source.XYZ url='https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}' />
      );

    case Source.GOOGLE_MAPS.SATELLITE:
      return (
        <source.XYZ url='https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' />
      );

    case Source.BING_MAPS.AERIAL_WITH_LABELS:
      return (
        <source.BingMaps
          apiKey={apiKeys.BING}
          imagerySet='AerialWithLabels'
          maxZoom={19}
        />
      );

    case Source.BING_MAPS.ROAD:
      return <source.BingMaps apiKey={apiKeys.BING} imagerySet='Road' />;

    default:
      return null;
  }
};

LayerSource.propTypes = {
  type: PropTypes.string,
  apiKeys: PropTypes.object,
};

export const BaseLayer = ({ apiKeys, layer, zIndex }) => (
  <LayerType type={layer.parameters.source} zIndex={zIndex}>
    <LayerSource type={layer.parameters.source} apiKeys={apiKeys} />
  </LayerType>
);

BaseLayer.propTypes = {
  apiKeys: PropTypes.object,
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};
