// @ts-ignore: untyped
import type { Feature } from '@collmot/ol-react';
import type { Layer } from '~/model/layers';

export type BaseFeatureProps = Omit<
  React.ComponentProps<Feature>,
  'id' | 'style'
>;

/**
 * Common props for every layer settings component.
 */
export type BaseLayerSettingsProps = {
  layer: Layer;
  layerId: string;
};
