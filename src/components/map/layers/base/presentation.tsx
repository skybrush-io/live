import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import MVTFormat from 'ol/format/MVT';
import type ImageTile from 'ol/ImageTile';
import type React from 'react';
import { type ChangeEvent } from 'react';

import { layer as olLayer, source } from '@collmot/ol-react';

import type { APIKeysRecord } from '~/APIKeys';
import { streetsV6Style } from '~/components/map/mapbox-style';
import type { Layer } from '~/model/layers';
import {
  Source,
  Sources,
  attributionsForSource,
  labelForSource,
} from '~/model/sources';

import type { BaseLayerSettingsProps as CommonLayerSettingsProps } from '../types';

// === Types ===

export type LoadImageTileFunction = (tile: ImageTile, url: string) => void;

// === Layer settings ===

export type BaseLayerSettingsProps = CommonLayerSettingsProps & {
  onLayerSourceChanged: (evt: ChangeEvent, value: Source.Source) => void;
};

export const BaseLayerSettings = ({
  layer,
  onLayerSourceChanged,
}: BaseLayerSettingsProps) => {
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
      value={layer.parameters['source']}
      onChange={(evt, value) =>
        onLayerSourceChanged(evt, value as Source.Source)
      }
    >
      {sourceRadioButtons}
    </RadioGroup>
  );
};

// === Layer type ===

type LayerTypeProps = {
  children: React.ReactNode;
  type: Source.Source;
  zIndex: number;
};

export const LayerType = ({ children, type, zIndex }: LayerTypeProps) => {
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
      return <olLayer.WebGLTile zIndex={zIndex}>{children}</olLayer.WebGLTile>;
  }
};

// === Layer source ===

const mvtFormat = new MVTFormat();

type LayerSourceProps = {
  apiKeys: APIKeysRecord;
  tileLoadFunction: LoadImageTileFunction;
  type: Source.Source;
};

export const LayerSource = ({
  apiKeys,
  tileLoadFunction,
  type,
}: LayerSourceProps) => {
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
          url='https://tile.skybrush.io/osm/{z}/{x}/{y}.png'
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
    case Source.GOOGLE.ROADS:
    case Source.GOOGLE.SATELLITE: {
      const mapType =
        type === Source.GOOGLE.SATELLITE
          ? 'satellite'
          : type === Source.GOOGLE.DEFAULT
            ? 'terrain'
            : 'roadmap';
      const layerTypes = type === Source.GOOGLE.DEFAULT ? ['layerRoadmap'] : [];
      return (
        <source.Google
          highDpi
          apiKey={apiKeys.GOOGLE}
          tileLoadFunction={tileLoadFunction}
          mapType={mapType}
          layerTypes={layerTypes}
          scale='scaleFactor2x'
        />
      );
    }

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

// === Base layer ===

export type BaseLayerProps = {
  layer: Layer;
  zIndex: number;
  LayerSource: React.ComponentType<{ type: Source.Source }>;
};

export const BaseLayer = ({ layer, zIndex, LayerSource }: BaseLayerProps) => {
  const layerSource = layer.parameters['source'] as Source.Source;
  return (
    <LayerType type={layerSource} zIndex={zIndex}>
      <LayerSource type={layerSource} />
    </LayerType>
  );
};
