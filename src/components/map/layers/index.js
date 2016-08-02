import React from 'react'
import { BaseLayerSettings, BaseLayer } from './base'
import { UAVsLayerSettings, UAVsLayer } from './uavs'
import { LayerType } from '../../../model/layers'

export const LayerSettings = {
  [LayerType.BASE]: BaseLayerSettings,
  [LayerType.UAVS]: UAVsLayerSettings
}

export const stateObjectToLayerSettings = (layer, layerId) => {
  if (!(layer.type in LayerSettings)) {
    throw new Error(`Cannot render settings for nonexistent layer type (${layer.type}).`)
  }

  const CurrentLayerSettings = LayerSettings[layer.type]
  return (<CurrentLayerSettings key={`${layerId}_settings`} layer={layer} />)
}

export const Layers = {
  [LayerType.BASE]: BaseLayer,
  [LayerType.UAVS]: UAVsLayer
}

export const stateObjectToLayer = (layer, layerId) => {
  if (!(layer.type in Layers)) {
    throw new Error(`Nonexistent layer type (${layer.type}) cannot be rendered.`)
  }

  const CurrentLayer = Layers[layer.type]
  return (<CurrentLayer key={`${layerId}_rendered`} layer={layer} />)
}
