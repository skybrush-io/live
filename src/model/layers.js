/**
 * @file Functions and constants related to the different types of layers
 * that we use on the map.
 */

import _ from 'lodash'
import React from 'react'

import ActionHelpOutline from 'material-ui/svg-icons/action/help-outline'
import ActionTimeline from 'material-ui/svg-icons/action/timeline'
import ActionTrackChanges from 'material-ui/svg-icons/action/track-changes'
import FileAttachment from 'material-ui/svg-icons/file/attachment'
import FileCloud from 'material-ui/svg-icons/file/cloud'
import Flight from 'material-ui/svg-icons/maps/flight'
import Streetview from 'material-ui/svg-icons/maps/streetview'
import ImageGridOn from 'material-ui/svg-icons/image/grid-on'
import Map from 'material-ui/svg-icons/maps/map'
import MyLocation from 'material-ui/svg-icons/maps/my-location'

/**
 * Enum containing constants for the various layer types that we support.
 */
export const LayerType = {
  BASE: 'base',
  FEATURES: 'features',
  GEOJSON: 'geojson',
  HEATMAP: 'heatmap',
  HEXGRID: 'hexgrid',
  OWN_LOCATION: 'ownLocation',
  TILE_SERVER: 'tileServer',
  UAVS: 'uavs',
  UAV_TRACE: 'uavTrace',
  UNTYPED: 'untyped'
}

/**
 * Constant containing all the layer types in the order preferred on the UI.
 */
export const LayerTypes = [
  LayerType.BASE, LayerType.TILE_SERVER, LayerType.FEATURES,
  LayerType.UAVS, LayerType.UAV_TRACE,
  LayerType.OWN_LOCATION, LayerType.GEOJSON, LayerType.HEXGRID,
  LayerType.HEATMAP
]

/**
 * Enum containing constants for the various tile server types that we support.
 */
export const TileServerType = {
  WMS: 'wms',
  XYZ: 'xyz',
  TILE_CACHE: 'tileCache'
}

/**
 * Constant containing all the supported tile server types in the order
 * preferred on the UI.
 */
export const TileServerTypes = [
  TileServerType.WMS, TileServerType.XYZ, TileServerType.TILE_CACHE
]

/**
 * Object mapping layer type constants to their properties (labels,
 * icons, default parameters etc).
 *
 * @type {Object}
 */
const _propertiesForLayerTypes = {
  [LayerType.BASE]: {
    label: 'Base layer',
    icon: <Map />,
    parameters: {
      source: 'osm'
    }
  },
  [LayerType.FEATURES]: {
    label: 'Features',
    icon: <Streetview />,
    parameters: {
    }
  },
  [LayerType.GEOJSON]: {
    label: 'GeoJSON layer',
    icon: <FileAttachment />,
    parameters: {
      data: {},
      strokeColor: {r: 85, g: 85, b: 225, alpha: 1},
      strokeWidth: 2,
      fillColor: {r: 170, g: 170, b: 225, alpha: 0.5}
    }
  },
  [LayerType.HEATMAP]: {
    label: 'Heatmap',
    icon: <ActionTrackChanges />,
    parameters: {
      subscriptions: [],
      minHue: 100,
      maxHue: 0,
      threshold: 0,
      minValue: 0,
      maxValue: 0,
      autoScale: true,
      maxPoints: 1000,
      unit: '',
      minDistance: 5,
      snapToGrid: false
    }
  },
  [LayerType.HEXGRID]: {
    label: 'Hex grid layer',
    icon: <ImageGridOn />,
    parameters: {
      center: [19.061951, 47.473340],
      size: 8,
      radius: 0.0005
    }
  },
  [LayerType.OWN_LOCATION]: {
    label: 'Own location',
    icon: <MyLocation />
  },
  [LayerType.TILE_SERVER]: {
    label: 'Tile server',
    icon: <FileCloud />,
    parameters: {
      type: TileServerType.WMS,
      url: 'http://ows.mundialis.de/services/service',
      layers: 'TOPO-OSM-WMS'
    }
  },
  [LayerType.UAVS]: {
    label: 'UAVs',
    icon: <Flight />,
    parameters: {
      colorPredicates: {}
    }
  },
  [LayerType.UAV_TRACE]: {
    label: 'UAV trace',
    icon: <ActionTimeline />,
    parameters: {
      trailLength: 10,
      trailWidth: 2,
      trailColor: {r: 0, g: 0, b: 0, a: 1}
    }
  },
  [LayerType.UNTYPED]: {
    label: 'Untyped layer',
    icon: <ActionHelpOutline />
  }
}

/**
 * Creates a new layer with the given unique identifier, name and type.
 *
 * @param  {string} id  the unique identifier of the layer
 * @param  {string} layerType  the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum or a falsey value;
 *         the latter is replaced with <code>LayerType.UNTYPED</code>.
 * @param  {string} name  the name of the layer
 * @param  {Object?} parameters  the parameters of the layer
 * @return {Object} a new layer object
 */
export function createNewLayer (id, layerType, name, parameters) {
  const effectiveLayerType = layerType || LayerType.UNTYPED
  return {
    id: id,
    type: effectiveLayerType,
    label: name,
    visible: effectiveLayerType !== LayerType.UNTYPED,
    parameters: parameters || defaultParametersForLayerType(effectiveLayerType)
  }
}

/**
 * Returns the default parameter settings for the given layer type.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {Object} the default parameter settings of the layer
 */
export function defaultParametersForLayerType (layerType) {
  const props = _propertiesForLayerTypes[layerType]
  const template = props.hasOwnProperty('parameters') ? props.parameters : {}
  return _.cloneDeep(template)
}

/**
 * Returns a Material UI icon that can be used to represent the layer of
 * the given type on the user interface.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {Object} the Material UI icon that represents the layer
 */
export function iconForLayerType (layerType) {
  return _propertiesForLayerTypes[layerType].icon
}

/**
 * Returns a human-readable label describing the given layer type on the
 * user interface.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {string} a human-readable description of the layer type
 */
export function labelForLayerType (layerType) {
  return _propertiesForLayerTypes[layerType].label
}
