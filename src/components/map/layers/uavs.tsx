import React, { useCallback } from 'react';
// @ts-ignore
import { layer as olLayer } from '@collmot/ol-react';

import Header from '@skybrush/mui-components/lib/FormHeader';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import flock from '~/flock';
import type FlockModel from '~/model/flock';
import { Layer } from '~/model/layers';
import type { Identifier } from '~/utils/collections';
import {
  type CoordinateTransformationFunction,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';

import type { BaseLayerSettingsProps } from './types';

// === Settings UI for this layer ===

export type UAVsLayerSettingsProps = BaseLayerSettingsProps & {
  setLayerParameters: (params: { labelColor: string }) => void;
};

export const UAVsLayerSettings = ({
  layer,
  setLayerParameters,
}: UAVsLayerSettingsProps) => {
  const { parameters } = layer;
  const { labelColor: labelColorParam } = parameters || {};
  const labelColor =
    typeof labelColorParam === 'string' ? labelColorParam : '#000000';

  const onColorChanged = useCallback(
    (color) => {
      setLayerParameters({ labelColor: color.hex });
    },
    [setLayerParameters]
  );

  return (
    <>
      <Header>Label color</Header>
      <SwatchesColorPicker
        color={labelColor}
        onChangeComplete={onColorChanged}
      />
    </>
  );
};

// === Layer ===

type UAVsLayerSourceProps = {
  selection: Identifier[];
  labelColor?: string;
  flock: FlockModel;
  projection?: CoordinateTransformationFunction;
};

export type UAVsLayerProps = {
  layer: Layer;
  LayerSource: React.ComponentType<UAVsLayerSourceProps>;
  selection: Identifier[];
  projection?: CoordinateTransformationFunction;
  zIndex?: number;
};

export const UAVsLayer = ({
  layer,
  LayerSource,
  projection = mapViewCoordinateFromLonLat,
  selection,
  zIndex,
}: UAVsLayerProps) => (
  <olLayer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <LayerSource
      selection={selection}
      labelColor={
        (layer.parameters['labelColor'] as string | undefined | null) ?? ''
      }
      flock={flock}
      projection={projection}
    />
  </olLayer.Vector>
);
