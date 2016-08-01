import React from 'react'
import { BaseLayerSettings, BaseLayer } from './base'
import { LayerType } from '../../../model/layers'

export const LayerSettings = {}
LayerSettings[LayerType.BASE] = BaseLayerSettings

export const stateObjectToLayerSettings = (layer) => {
  if (!(layer.type in LayerSettings)) {
    throw new Error(`Cannot render settings for nonexistent layer type (${layer.type}).`)
  }

  const CurrentLayerSettings = LayerSettings[layer.type]
  return (<CurrentLayerSettings layer={layer} />)
}

export const Layers = {}
Layers[LayerType.BASE] = BaseLayer

export const stateObjectToLayer = (layer) => {
  if (!(layer.type in Layers)) {
    throw new Error(`Nonexistent layer type (${layer.type}) cannot be rendered.`)
  }

  const CurrentLayer = Layers[layer.type]
  return (<CurrentLayer layer={layer} />)
}
