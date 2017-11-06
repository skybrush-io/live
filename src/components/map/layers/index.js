import React from 'react'

import { BaseLayerSettings, BaseLayer } from './base'
import { FeaturesLayerSettings, FeaturesLayer } from './features'
import { GeoJSONLayerSettings, GeoJSONLayer } from './geojson'
import { HeatmapLayerSettings, HeatmapLayer } from './heatmap'
import { HexGridLayerSettings, HexGridLayer } from './hexgrid'
import { OwnLocationLayerSettings, OwnLocationLayer } from './ownlocation'
import { TileServerLayerSettings, TileServerLayer } from './tileserver'
import { UAVsLayerSettings, UAVsLayer } from './uavs'
import { UAVTraceLayerSettings, UAVTraceLayer } from './uavtrace'
import { UntypedLayerSettings, UntypedLayer } from './untyped'

import { LayerType } from '../../../model/layers'

export const LayerSettings = {
  [LayerType.BASE]: BaseLayerSettings,
  [LayerType.FEATURES]: FeaturesLayerSettings,
  [LayerType.GEOJSON]: GeoJSONLayerSettings,
  [LayerType.HEATMAP]: HeatmapLayerSettings,
  [LayerType.HEXGRID]: HexGridLayerSettings,
  [LayerType.OWN_LOCATION]: OwnLocationLayerSettings,
  [LayerType.TILE_SERVER]: TileServerLayerSettings,
  [LayerType.UAVS]: UAVsLayerSettings,
  [LayerType.UAV_TRACE]: UAVTraceLayerSettings,
  [LayerType.UNTYPED]: UntypedLayerSettings
}

export const stateObjectToLayerSettings = (layer, layerId) => {
  if (!(layer.type in LayerSettings)) {
    throw new Error(`Cannot render settings for nonexistent layer type (${layer.type}).`)
  }

  const CurrentLayerSettings = LayerSettings[layer.type]
  return (<CurrentLayerSettings key={`${layerId}_settings`} layer={layer} layerId={layerId} />)
}

export const Layers = {
  [LayerType.BASE]: BaseLayer,
  [LayerType.FEATURES]: FeaturesLayer,
  [LayerType.GEOJSON]: GeoJSONLayer,
  [LayerType.HEATMAP]: HeatmapLayer,
  [LayerType.HEXGRID]: HexGridLayer,
  [LayerType.OWN_LOCATION]: OwnLocationLayer,
  [LayerType.TILE_SERVER]: TileServerLayer,
  [LayerType.UAVS]: UAVsLayer,
  [LayerType.UAV_TRACE]: UAVTraceLayer,
  [LayerType.UNTYPED]: UntypedLayer
}

export const stateObjectToLayer = (layer, zIndex) => {
  if (!(layer.type in Layers)) {
    throw new Error(`Nonexistent layer type (${layer.type}) cannot be rendered.`)
  }

  const CurrentLayer = Layers[layer.type]
  return (<CurrentLayer key={`${layer.id}_rendered`} layer={layer}
    layerId={layer.id} zIndex={zIndex} />)
}
