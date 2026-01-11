import type React from 'react';
import { useCallback } from 'react';
// @ts-expect-error
import { layer as olLayer } from '@collmot/ol-react';

import Slider from '@mui/material/Slider';
import { FormHeader as Header } from '@skybrush/mui-components';

import SwatchesColorPicker, {
  type ColorResult,
} from '~/components/SwatchesColorPicker';
import flock from '~/flock';
import type FlockModel from '~/model/flock';
import type { Layer } from '~/model/layers';
import type { Identifier } from '~/utils/collections';
import {
  type CoordinateTransformationFunction,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';

import type { BaseLayerSettingsProps } from './types';

// === Settings UI for this layer ===

export type UAVsLayerSettingsProps = BaseLayerSettingsProps & {
  setLayerParameters: (
    params: Partial<{ labelColor: string; scale: number }>
  ) => void;
};

const MARKS = [{ value: 1 }];

export const UAVsLayerSettings = ({
  layer,
  setLayerParameters,
}: UAVsLayerSettingsProps) => {
  const { parameters } = layer;
  const { labelColor: labelColorParam, scale: scaleParam } = parameters || {};
  const labelColor =
    typeof labelColorParam === 'string' ? labelColorParam : '#000000';
  const scale = typeof scaleParam === 'number' ? scaleParam : 1;

  const onColorChanged = useCallback(
    (color: ColorResult) => {
      setLayerParameters({ labelColor: color.hex });
    },
    [setLayerParameters]
  );

  const onScaleChanged = useCallback(
    (event: Event, value: number | number[]) => {
      setLayerParameters({ scale: value as number });
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
      <Header>Icon size</Header>
      <Slider
        value={scale}
        min={0.2}
        max={2}
        marks={MARKS}
        step={0.1}
        onChange={onScaleChanged}
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
  labelHidden?: boolean;
  scale?: number;
};

export type UAVsLayerProps = {
  layer: Layer;
  LayerSource: React.ComponentType<UAVsLayerSourceProps>;
  selection: Identifier[];
  projection?: CoordinateTransformationFunction;
  zIndex?: number;
  labelHidden?: boolean;
};

export const UAVsLayer = ({
  layer,
  LayerSource,
  projection = mapViewCoordinateFromLonLat,
  selection,
  zIndex,
  labelHidden,
}: UAVsLayerProps) => (
  <olLayer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <LayerSource
      selection={selection}
      labelColor={
        (layer.parameters['labelColor'] as string | undefined | null) ?? ''
      }
      scale={(layer.parameters['scale'] as number | undefined | null) ?? 1}
      flock={flock}
      projection={projection}
      labelHidden={labelHidden}
    />
  </olLayer.Vector>
);
