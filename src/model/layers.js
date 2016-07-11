/**
 * @file Functions and constants related to the different types of layers
 * that we use on the map.
 */

import React from 'react'

import ActionTrackChanges from 'material-ui/svg-icons/action/track-changes'
import Flight from 'material-ui/svg-icons/maps/flight'
import Map from 'material-ui/svg-icons/maps/map'
import MyLocation from 'material-ui/svg-icons/maps/my-location'
import FileAttachment from 'material-ui/svg-icons/file/attachment'

/**
 * Enum containing constants for the various layer types that we support.
 */
export const LayerType = {
  BASE: 'base',
  GEOJSON: 'geojson',
  HEATMAP: 'heatmap',
  OWN_LOCATION: 'ownLocation',
  UAVS: 'uavs'
}

/**
 * Object mapping layer type constants to their visual properties (labels,
 * icons etc) on the user interface.
 *
 * @type {Object}
 */
const visualRepresentationsForLayerTypes_ = {}
visualRepresentationsForLayerTypes_[LayerType.BASE] = {
  label: 'Base layer',
  icon: <Map />
}
visualRepresentationsForLayerTypes_[LayerType.GEOJSON] = {
  label: 'GeoJSON layer',
  icon: <FileAttachment />
}
visualRepresentationsForLayerTypes_[LayerType.HEATMAP] = {
  label: 'Heatmap',
  icon: <ActionTrackChanges />
}
visualRepresentationsForLayerTypes_[LayerType.OWN_LOCATION] = {
  label: 'Own location',
  icon: <MyLocation />
}
visualRepresentationsForLayerTypes_[LayerType.UAVS] = {
  label: 'UAVs',
  icon: <Flight />
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
  return visualRepresentationsForLayerTypes_[layerType]['icon']
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
  return visualRepresentationsForLayerTypes_[layerType]['label']
}
