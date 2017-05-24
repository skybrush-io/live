import React from 'react'
import { BaseLayerSettings, BaseLayer } from './base'
import { UAVsLayerSettings, UAVsLayer } from './uavs'
import { OwnLocationLayerSettings, OwnLocationLayer } from './ownlocation'
import { UAVTraceLayerSettings, UAVTraceLayer } from './uavtrace'
import { GeoJSONLayerSettings, GeoJSONLayer } from './geojson'
import { UntypedLayerSettings, UntypedLayer } from './untyped'
import { HexGridLayerSettings, HexGridLayer } from './hexgrid'
import { HeatmapLayerSettings, HeatmapLayer } from './heatmap'
import { WMSLayerSettings, WMSLayer } from './wms'
import { LayerType } from '../../../model/layers'

export const LayerSettings = {
  [LayerType.BASE]: BaseLayerSettings,
  [LayerType.WMS]: WMSLayerSettings,
  [LayerType.UAVS]: UAVsLayerSettings,
  [LayerType.OWN_LOCATION]: OwnLocationLayerSettings,
  [LayerType.UAV_TRACE]: UAVTraceLayerSettings,
  [LayerType.GEOJSON]: GeoJSONLayerSettings,
  [LayerType.UNTYPED]: UntypedLayerSettings,
  [LayerType.HEXGRID]: HexGridLayerSettings,
  [LayerType.HEATMAP]: HeatmapLayerSettings
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
  [LayerType.WMS]: WMSLayer,
  [LayerType.UAVS]: UAVsLayer,
  [LayerType.OWN_LOCATION]: OwnLocationLayer,
  [LayerType.UAV_TRACE]: UAVTraceLayer,
  [LayerType.GEOJSON]: GeoJSONLayer,
  [LayerType.UNTYPED]: UntypedLayer,
  [LayerType.HEXGRID]: HexGridLayer,
  [LayerType.HEATMAP]: HeatmapLayer
}

export const stateObjectToLayer = (layer, layerId, zIndex) => {
  if (!(layer.type in Layers)) {
    throw new Error(`Nonexistent layer type (${layer.type}) cannot be rendered.`)
  }

  const CurrentLayer = Layers[layer.type]
  return (<CurrentLayer key={`${layerId}_rendered`} layer={layer}
    layerId={layerId} zIndex={zIndex} />)
}
