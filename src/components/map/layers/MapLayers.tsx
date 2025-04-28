import React from 'react';

import type { ModifyEvent } from 'ol/interaction/Modify';
import type { Tool } from '~/components/map/tools';
import type { Layer, LayerType } from '~/model/layers';

type FeatureModifiedHandler = (event: ModifyEvent) => void;

export type LayerProps = {
  layer: Layer;
  selectedTool: Tool;
  zIndex: number;
  onFeaturesModified?: FeatureModifiedHandler;
};

export type LayerConfig = {
  /**
   * The layers to render.
   */
  layers: Layer[];

  /**
   * Record that maps layer types to the component that should be used for rendering.
   */
  layerComponents: Partial<Record<LayerType, React.ComponentType<LayerProps>>>;

  /**
   * Layer types that should not be rendered.
   */
  excludedLayerTypes?: LayerType[];
};

type MapLayersProps = LayerConfig & {
  /**
   * The currently selected tool.
   */
  selectedTool: Tool;

  /**
   * The `ModifyEvent` handler the layers should use.
   */
  onFeaturesModified?: FeatureModifiedHandler;
};

/**
 * React component that renders the layers of the map.
 */
export const MapLayers = ({
  layers,
  layerComponents,
  onFeaturesModified,
  selectedTool,
  excludedLayerTypes,
}: MapLayersProps) => {
  const shownLayers = excludedLayerTypes
    ? layers.filter((l) => !excludedLayerTypes.includes(l.type))
    : layers;
  const renderedLayers: React.ReactElement[] = [];

  let zIndex = 0;
  for (const layer of shownLayers) {
    const CurrentLayer = layerComponents[layer.type];
    if (CurrentLayer !== undefined) {
      renderedLayers.push(
        <CurrentLayer
          key={`${layer.id}_rendered`}
          layer={layer}
          onFeaturesModified={onFeaturesModified}
          selectedTool={selectedTool}
          zIndex={zIndex}
        />
      );
      zIndex++;
    }
  }

  return <>{renderedLayers}</>;
};
