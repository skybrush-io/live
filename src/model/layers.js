/**
 * @file Functions and constants related to the different types of layers
 * that we use on the map.
 */

import _ from 'lodash'
import React from 'react'

import ActionHelpOutline from 'material-ui/svg-icons/action/help-outline'
import ActionTrackChanges from 'material-ui/svg-icons/action/track-changes'
import Flight from 'material-ui/svg-icons/maps/flight'
import Map from 'material-ui/svg-icons/maps/map'
import MyLocation from 'material-ui/svg-icons/maps/my-location'
import FileAttachment from 'material-ui/svg-icons/file/attachment'
import ImageGridOn from 'material-ui/svg-icons/image/grid-on'

/**
 * Enum containing constants for the various layer types that we support.
 */
export const LayerType = {
  BASE: 'base',
  GEOJSON: 'geojson',
  HEATMAP: 'heatmap',
  HEXGRID: 'hexgrid',
  OWN_LOCATION: 'ownlocation',
  UAVS: 'uavs',
  UNTYPED: 'untyped'
}

/**
 * Constant containing all the layer types in the order preferred on the UI.
 */
export const LayerTypes = [
  LayerType.BASE, LayerType.UAVS, LayerType.OWN_LOCATION,
  LayerType.GEOJSON, LayerType.HEXGRID, LayerType.HEATMAP
]

/**
 * Object mapping layer type constants to their properties (labels,
 * icons, default parameters etc).
 *
 * @type {Object}
 */
const propertiesForLayerTypes_ = {}
propertiesForLayerTypes_[LayerType.BASE] = {
  label: 'Base layer',
  icon: <Map />,
  parameters: {
    source: 'osm'
  }
}
propertiesForLayerTypes_[LayerType.GEOJSON] = {
  label: 'GeoJSON layer',
  icon: <FileAttachment />
}
propertiesForLayerTypes_[LayerType.HEXGRID] = {
  label: 'HEX Grid layer',
  icon: <ImageGridOn />
}
propertiesForLayerTypes_[LayerType.HEATMAP] = {
  label: 'Heatmap',
  icon: <ActionTrackChanges />
}
propertiesForLayerTypes_[LayerType.OWN_LOCATION] = {
  label: 'Own location',
  icon: <MyLocation />
}
propertiesForLayerTypes_[LayerType.UAVS] = {
  label: 'UAVs',
  icon: <Flight />
}
propertiesForLayerTypes_[LayerType.UNTYPED] = {
  label: 'Untyped layer',
  icon: <ActionHelpOutline />
}

/**
 * Creates a new layer with the given name and type.
 *
 * @param  {string} layerType  the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum or a falsey value;
 *         the latter is replaced with <code>LayerType.UNTYPED</code>.
 * @param  {string} name  the name of the layer
 * @param  {Object?} parameters  the parameters of the layer
 * @return {Object} a new layer object
 */
export function createNewLayer (layerType, name, parameters) {
  const effectiveLayerType = layerType || LayerType.UNTYPED
  return {
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
  const props = propertiesForLayerTypes_[layerType]
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
  return propertiesForLayerTypes_[layerType].icon
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
  return propertiesForLayerTypes_[layerType].label
}
