import type { Feature } from '@collmot/ol-react';
import type { Layer } from '~/model/layers';

export type BaseFeatureProps = Omit<
  React.ComponentProps<typeof Feature>,
  'id' | 'style'
>;

/**
 * Common props for every layer settings component.
 */
export type BaseLayerSettingsProps<P = unknown> = {
  layer: Layer<P>;
  layerId: string;
};
