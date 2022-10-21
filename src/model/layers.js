/**
 * @file Functions and constants related to the different types of layers
 * that we use on the map.
 */

import cloneDeep from 'lodash-es/cloneDeep';
import has from 'lodash-es/has';
import React from 'react';

import FileAttachment from '@material-ui/icons/Attachment';
import FileCloud from '@material-ui/icons/Cloud';
import Flight from '@material-ui/icons/Flight';
import Gamepad from '@material-ui/icons/Gamepad';
import Grid from '@material-ui/icons/GridOn';
import HelpOutline from '@material-ui/icons/HelpOutline';
import Image from '@material-ui/icons/Image';
import Info from '@material-ui/icons/Info';
import Streetview from '@material-ui/icons/Streetview';
import Map from '@material-ui/icons/Map';
import MyLocation from '@material-ui/icons/MyLocation';
import Timeline from '@material-ui/icons/Timeline';
import TrackChanges from '@material-ui/icons/TrackChanges';

import Antenna from '~/icons/Antenna';

/**
 * Enum containing constants for the various layer types that we support.
 */
export const LayerType = {
  BASE: 'base',
  BEACONS: 'beacons',
  DOCKS: 'docks',
  FEATURES: 'features',
  GEOJSON: 'geojson',
  GRATICULE: 'graticule',
  HEATMAP: 'heatmap',
  HEXGRID: 'hexgrid',
  IMAGE: 'image',
  MISSION_INFO: 'home', // don't rename this -- backwards compatibility
  OWN_LOCATION: 'ownLocation',
  TILE_SERVER: 'tileServer',
  UAVS: 'uavs',
  UAV_TRACE: 'uavTrace',
  UNTYPED: 'untyped',
};

/**
 * Constant containing all the layer types in the order preferred on the UI.
 */
export const LayerTypes = [
  LayerType.BASE,
  LayerType.TILE_SERVER,
  LayerType.GRATICULE,
  LayerType.FEATURES,
  LayerType.IMAGE,
  LayerType.UAVS,
  LayerType.BEACONS,
  LayerType.DOCKS,
  LayerType.UAV_TRACE,
  LayerType.MISSION_INFO,
  LayerType.OWN_LOCATION,
  LayerType.GEOJSON,
  LayerType.HEATMAP,
];

/**
 * Enum containing constants for the various tile server types that we support.
 */
export const TileServerType = {
  WMS: 'wms',
  XYZ: 'xyz',
  TILE_CACHE: 'tileCache',
};

/**
 * Constant containing all the supported tile server types in the order
 * preferred on the UI.
 */
export const TileServerTypes = [
  TileServerType.WMS,
  TileServerType.XYZ,
  TileServerType.TILE_CACHE,
];

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
      source: 'osm',
    },
  },
  [LayerType.BEACONS]: {
    label: 'Beacons',
    icon: <Antenna />,
    parameters: {},
  },
  [LayerType.DOCKS]: {
    label: 'Docking stations',
    icon: <Gamepad />,
    parameters: {},
  },
  [LayerType.FEATURES]: {
    label: 'Features',
    icon: <Streetview />,
    parameters: {},
  },
  [LayerType.GEOJSON]: {
    label: 'GeoJSON layer',
    icon: <FileAttachment />,
    parameters: {
      data: {},
      strokeColor: { r: 85, g: 85, b: 225, alpha: 1 },
      strokeWidth: 2,
      fillColor: { r: 170, g: 170, b: 225, alpha: 0.5 },
    },
    multiple: true,
  },
  [LayerType.GRATICULE]: {
    label: 'Graticule',
    icon: <Grid />,
    parameters: {
      strokeColor: { r: 0, g: 0, b: 0, alpha: 0.2 },
      strokeWidth: 1,
    },
  },
  [LayerType.HEATMAP]: {
    label: 'Heatmap',
    icon: <TrackChanges />,
    parameters: {
      subscriptions: [],
      minHue: 100,
      maxHue: 0,
      threshold: 0,
      coloringFunction: 'linear',
      minValue: 0,
      maxValue: 0,
      autoScale: true,
      maxPoints: 1000,
      unit: '',
      minDistance: 5,
      snapToGrid: false,
    },
  },
  [LayerType.IMAGE]: {
    label: 'Image',
    icon: <Image />,
    parameters: {
      image: {
        data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmYiLz4KPHBhdGggZD0ibTAgMCAxMDAgMTAwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMXB4Ii8+CjxwYXRoIGQ9Ik0gMCwxMDAgMTAwLDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxcHgiLz4KPC9zdmc+Cg==',
        name: '',
        dimensions: {},
      },
      transform: {
        position: undefined,
        angle: 0,
        scale: 1,
      },
    },
    multiple: true,
  },
  [LayerType.HEXGRID]: {
    label: 'Hex grid layer',
    icon: <Grid />,
    parameters: {
      center: [19.061951, 47.47334],
      size: 8,
      radius: 0.0005,
    },
  },
  [LayerType.MISSION_INFO]: {
    label: 'Mission info',
    icon: <Info />,
    parameters: {
      showConvexHull: true,
      showOrigin: true,
      showHomePositions: true,
      showLandingPositions: false,
      showTrajectoriesOfSelection: true,
    },
  },
  [LayerType.OWN_LOCATION]: {
    label: 'Own location',
    icon: <MyLocation />,
  },
  [LayerType.TILE_SERVER]: {
    label: 'Tile server',
    icon: <FileCloud />,
    parameters: {
      type: TileServerType.WMS,
      url: 'http://ows.mundialis.de/services/service',
      layers: 'TOPO-OSM-WMS',
    },
    multiple: true,
  },
  [LayerType.UAVS]: {
    label: 'UAVs',
    icon: <Flight />,
    parameters: {},
  },
  [LayerType.UAV_TRACE]: {
    label: 'UAV trace',
    icon: <Timeline />,
    parameters: {
      trailLength: 10,
      trailWidth: 2,
      trailColor: { r: 0, g: 0, b: 0, a: 1 },
    },
  },
  [LayerType.UNTYPED]: {
    label: 'Untyped layer',
    icon: <HelpOutline />,
  },
};

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
export function createNewLayer(id, layerType, name, parameters) {
  const effectiveLayerType = layerType || LayerType.UNTYPED;
  return {
    id,
    type: effectiveLayerType,
    label: name,
    visible: effectiveLayerType !== LayerType.UNTYPED,
    parameters: parameters || defaultParametersForLayerType(effectiveLayerType),
  };
}

/**
 * Returns whether the given layer can be added to the map more than once.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {boolean} whether the given layer can be added to the map more than once.
 */
export function areMultipleInstancesAllowedForLayerType(layerType) {
  return _propertiesForLayerTypes[layerType].multiple;
}

/**
 * Returns the default parameter settings for the given layer type.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {Object} the default parameter settings of the layer
 */
export function defaultParametersForLayerType(layerType) {
  const props = _propertiesForLayerTypes[layerType];
  const template = has(props, 'parameters') ? props.parameters : {};
  return cloneDeep(template);
}

/**
 * Returns all the visible editable layers from the given OpenLayers
 * map object.
 *
 * @param  {ol.Map} map the OpenLayers map
 * @return {Array} an array containing all the editable visible layers
 */
export function getVisibleEditableLayers(map) {
  return map
    .getLayers()
    .getArray()
    .filter(isLayerEditable)
    .filter(isLayerVisible);
}

/**
 * Returns all the visible selectable layers from the given OpenLayers
 * map object.
 *
 * @param  {ol.Map} map the OpenLayers map
 * @return {Array} an array containing all the selectable visible layers
 */
export function getVisibleSelectableLayers(map) {
  return map
    .getLayers()
    .getArray()
    .filter(isLayerSelectable)
    .filter(isLayerVisible);
}

/**
 * Returns a Material UI icon that can be used to represent the layer of
 * the given type on the user interface.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {Object} the Material UI icon that represents the layer
 */
export function iconForLayerType(layerType) {
  return _propertiesForLayerTypes[layerType].icon;
}

/**
 * Returns true if the features of the given layer may trigger a tooltip to
 * be displayed if the feature is close to the mouse cursor.
 *
 * @param {ol.Layer} layer  the layer to test
 * @return {boolean} whether the given layer contains features that may be
 *     selected by the user
 */
export function canLayerTriggerTooltip(layer) {
  return layer && layer.getVisible() && layer.get('triggersTooltip');
}

/**
 * Returns true if the given layer contains features that may be edited
 * by the user.
 *
 * @param {ol.Layer} layer  the layer to test
 * @return {boolean} whether the given layer contains features that may be
 *     edited by the user
 */
export function isLayerEditable(layer) {
  return layer && layer.getVisible() && layer.get('editable');
}

/**
 * Returns true if the given layer contains features that may be selected
 * by the user.
 *
 * @param {ol.Layer} layer  the layer to test
 * @return {boolean} whether the given layer contains features that may be
 *     selected by the user
 */
export function isLayerSelectable(layer) {
  return layer && layer.getVisible() && layer.get('selectable');
}

/**
 * Given a layer object from the state store, returns whether the layer is
 * visible.
 *
 * @param  {Object}  layer  the layer object from the state store
 * @return {boolean} whether the layer is visible
 */
export function isLayerVisible(layer) {
  return layer && (!has(layer, 'visible') || Boolean(layer.visible));
}

/**
 * Returns a human-readable label describing the given layer type on the
 * user interface.
 *
 * @param  {string} layerType the type of the layer; must be one of the
 *         constants from the {@link LayerType} enum
 * @return {string} a human-readable description of the layer type
 */
export function labelForLayerType(layerType) {
  return _propertiesForLayerTypes[layerType].label;
}

/**
 * Sets whether the given layer is editable or not.
 *
 * @param  {ol.Layer}  layer  the layer to update
 * @param  {boolean}   editable  whether the layer should be editable
 */
export function setLayerEditable(layer, editable = true) {
  layer.set('editable', editable);
}

/**
 * Sets whether the given layer is selectable or not.
 *
 * @param  {ol.Layer}  layer  the layer to update
 * @param  {boolean}   selectable  whether the layer should be selectable
 */
export function setLayerSelectable(layer, selectable = true) {
  layer.set('selectable', selectable);
}

/**
 * Sets whether the features on the given layer close to the mouse cursor will
 * trigger a tooltip or not.
 *
 * @param  {ol.Layer}  layer  the layer to update
 * @param  {boolean}   selectable  whether the features of the layer should
 *         trigger a tooltip
 */
export function setLayerTriggersTooltip(layer, triggers = true) {
  layer.set('triggersTooltip', triggers);
}
