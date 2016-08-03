import React from 'react'
import { BaseLayerSettings, BaseLayer } from './base'
import { UAVsLayerSettings, UAVsLayer } from './uavs'
import { GeoJSONLayerSettings, GeoJSONLayer } from './geojson'
import { UntypedLayerSettings, UntypedLayer } from './untyped'
import { LayerType } from '../../../model/layers'

export const LayerSettings = {
  [LayerType.BASE]: BaseLayerSettings,
  [LayerType.UAVS]: UAVsLayerSettings,
  [LayerType.GEOJSON]: GeoJSONLayerSettings,
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
  [LayerType.UAVS]: UAVsLayer,
  [LayerType.GEOJSON]: GeoJSONLayer,
  [LayerType.UNTYPED]: UntypedLayer
}

export const stateObjectToLayer = (layer, layerId, zIndex) => {
  if (!(layer.type in Layers)) {
    throw new Error(`Nonexistent layer type (${layer.type}) cannot be rendered.`)
  }

  const CurrentLayer = Layers[layer.type]
  return (<CurrentLayer key={`${layerId}_rendered`} layer={layer}
    layerId={layerId} zIndex={zIndex} />)
}
