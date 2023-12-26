/**
 * @file Functions and constants related to the different types of layers
 * that we use on the map.
 */

import * as React from 'react';

import Block from '@material-ui/icons/Block';
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

import type BaseLayer from 'ol/layer/Base';
import type OLLayer from 'ol/layer/Layer';
import type OLMap from 'ol/Map';

import Antenna from '~/icons/Antenna';

/**
 * Enum containing constants for the various layer types that we support.
 */
export enum LayerType {
  BASE = 'base',
  BEACONS = 'beacons',
  DOCKS = 'docks',
  FEATURES = 'features',
  GEOJSON = 'geojson',
  GRATICULE = 'graticule',
  HEATMAP = 'heatmap',
  HEXGRID = 'hexgrid',
  IMAGE = 'image',

  // TODO: Left for backwards compatibility, rename at the next major version!
  MISSION_INFO = 'home',

  OWN_LOCATION = 'ownLocation',
  TILE_SERVER = 'tileServer',
  UAVS = 'uavs',
  UAV_TRACE = 'uavTrace',
  UNAVAILABLE = 'unavailable',
  UNTYPED = 'untyped',
}

export type Layer = {
  id: string;
  type: LayerType;
  label: string;
  visible: boolean;
  parameters: Record<string, unknown>;
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
] as const;

export const ProLayerTypes = [LayerType.IMAGE] as const;

/**
 * Enum containing constants for the various tile server types that we support.
 */
export enum TileServerType {
  WMS = 'wms',
  XYZ = 'xyz',
  TILE_CACHE = 'tileCache',
}

/**
 * Constant containing all the supported tile server types in the order
 * preferred on the UI.
 */
export const TileServerTypes = [
  TileServerType.WMS,
  TileServerType.XYZ,
  TileServerType.TILE_CACHE,
] as const;

// TODO: Maybe create a union type for layer parameter schemas?

/**
 * Object mapping layer type constants to their properties.
 * (labels, icons, default parameters etc.)
 */
const propertiesForLayerTypes: Record<
  LayerType,
  {
    label: string;
    icon: React.ComponentType;
    parameters?: Record<string, unknown>;
    multiple?: boolean;
  }
> = {
  [LayerType.BASE]: {
    label: 'Base layer',
    icon: Map,
    parameters: {
      source: 'osm',
    },
  },
  [LayerType.BEACONS]: {
    label: 'Beacons',
    icon: Antenna,
    parameters: {},
  },
  [LayerType.DOCKS]: {
    label: 'Docking stations',
    icon: Gamepad,
    parameters: {},
  },
  [LayerType.FEATURES]: {
    label: 'Features',
    icon: Streetview,
    parameters: {},
  },
  [LayerType.GEOJSON]: {
    label: 'GeoJSON layer',
    icon: FileAttachment,
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
    icon: Grid,
    parameters: {
      strokeColor: { r: 0, g: 0, b: 0, alpha: 0.2 },
      strokeWidth: 1,
    },
  },
  [LayerType.HEATMAP]: {
    label: 'Heatmap',
    icon: TrackChanges,
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
    icon: Image,
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
    icon: Grid,
    parameters: {
      center: [19.061951, 47.47334],
      size: 8,
      radius: 0.0005,
    },
  },
  [LayerType.MISSION_INFO]: {
    label: 'Mission info',
    icon: Info,
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
    icon: MyLocation,
    parameters: {
      showAccuracy: true,
      showOrientation: true,
    },
  },
  [LayerType.TILE_SERVER]: {
    label: 'Tile server',
    icon: FileCloud,
    parameters: {
      type: TileServerType.WMS,
      url: 'http://ows.mundialis.de/services/service',
      layers: 'TOPO-OSM-WMS',
    },
    multiple: true,
  },
  [LayerType.UAVS]: {
    label: 'UAVs',
    icon: Flight,
    parameters: {},
  },
  [LayerType.UAV_TRACE]: {
    label: 'UAV trace',
    icon: Timeline,
    parameters: {
      trailLength: 10,
      trailWidth: 2,
      trailColor: { r: 0, g: 0, b: 0, a: 1 },
    },
  },
  [LayerType.UNAVAILABLE]: {
    label: 'Unavailable layer',
    icon: Block,
  },
  [LayerType.UNTYPED]: {
    label: 'Untyped layer',
    icon: HelpOutline,
  },
} as const;

/**
 * Creates a new layer with the given unique identifier, name and type.
 *
 * @param id - The unique identifier of the layer
 * @param layerType - The type of the layer; must be one of the constants from
 *                    the {@link LayerType} enum or a nullish value; the latter
 *                    is replaced with <code>LayerType.UNTYPED</code>.
 * @param name - The name of the layer
 * @param parameters - The parameters of the layer
 * @returns A new layer object
 */
export function createNewLayer(
  id: string,
  layerType: LayerType | undefined,
  name: string,
  parameters?: Record<string, unknown>
): Layer {
  const effectiveLayerType = layerType ?? LayerType.UNTYPED;
  return {
    id,
    type: effectiveLayerType,
    label: name,
    visible: effectiveLayerType !== LayerType.UNTYPED,
    parameters: parameters ?? defaultParametersForLayerType(effectiveLayerType),
  };
}

/**
 * Returns whether the given layer can be added to the map more than once.
 *
 * @param layerType - The type of the layer; must be one of the
 *                    constants from the {@link LayerType} enum
 * @returns Whether the given layer can be added to the map more than once.
 */
export function areMultipleInstancesAllowedForLayerType(
  layerType: LayerType
): boolean {
  return propertiesForLayerTypes[layerType].multiple ?? false;
}

/**
 * Returns the default parameter settings for the given layer type.
 *
 * @param layerType - The type of the layer; must be one of the
 *                    constants from the {@link LayerType} enum
 * @returns The default parameter settings of the layer
 */
export function defaultParametersForLayerType(
  layerType: LayerType
): Record<string, unknown> {
  const props = propertiesForLayerTypes[layerType];
  const template = props?.parameters ?? {};
  return structuredClone(template);
}

/**
 * Returns all the visible editable layers from the given OpenLayers
 * map object.
 *
 * @param map - The OpenLayers map
 * @returns An array containing all the editable visible layers
 */
export function getVisibleEditableLayers(map: OLMap): BaseLayer[] {
  return map.getLayers().getArray().filter(isLayerVisibleAndEditable);
}

/**
 * Returns all the visible selectable layers from the given OpenLayers
 * map object.
 *
 * @param map - The OpenLayers map
 * @returns An array containing all the selectable visible layers
 */
export function getVisibleSelectableLayers(map: OLMap): BaseLayer[] {
  return map.getLayers().getArray().filter(isLayerVisibleAndSelectable);
}

/**
 * Returns a Material UI icon that can be used to represent the layer of
 * the given type on the user interface.
 *
 * @param layerType - The type of the layer; must be one of the
 *                    constants from the {@link LayerType} enum
 * @returns The Material UI icon that represents the layer
 */
export function iconForLayerType(layerType: LayerType): JSX.Element {
  return React.createElement(propertiesForLayerTypes[layerType].icon);
}

/**
 * Returns true if the features of the given layer are visible and may trigger
 * a tooltip to be displayed if the feature is close to the mouse cursor.
 *
 * @param layer - The layer to test
 * @returns Whether the given layer is visible and contains features that may
 *          trigger a tooltip if the feature is close to the mouse cursor.
 */
export function canLayerTriggerTooltip(layer: BaseLayer): boolean {
  return Boolean(layer?.getVisible?.() && layer.get('triggersTooltip'));
}

/**
 * Returns true if the given layer is visible and
 * contains features that may be edited by the user.
 *
 * @param layer - The layer to test
 * @returns Whether the given layer is visible and
 *          contains features that may be edited by the user
 */
export function isLayerVisibleAndEditable(layer: BaseLayer): boolean {
  return Boolean(layer?.getVisible?.() && layer.get('editable'));
}

/**
 * Returns true if the given layer is visible and
 * contains features that may be selected by the user.
 *
 * @param layer - The layer to test
 * @returns Whether the given layer is visible and
 *          contains features that may be selected by the user
 */
export function isLayerVisibleAndSelectable(layer: BaseLayer): boolean {
  return Boolean(layer?.getVisible?.() && layer.get('selectable'));
}

/**
 * Returns a human-readable label describing the given layer type on the
 * user interface.
 *
 * @param layerType - The type of the layer; must be one of the
 *                    constants from the {@link LayerType} enum
 * @returns A human-readable description of the layer type
 */
export function labelForLayerType(layerType: LayerType): string {
  return propertiesForLayerTypes[layerType].label;
}

/**
 * Sets whether the given layer is editable or not.
 *
 * @param layer - The layer to update
 * @param editable - Whether the layer should be editable
 */
export function setLayerEditable(layer: OLLayer, editable = true): void {
  layer.set('editable', editable);
}

/**
 * Sets whether the given layer is selectable or not.
 *
 * @param layer - The layer to update
 * @param selectable - Whether the layer should be selectable
 */
export function setLayerSelectable(layer: OLLayer, selectable = true): void {
  layer.set('selectable', selectable);
}

/**
 * Sets whether the features on the given layer close to the mouse cursor will
 * trigger a tooltip or not.
 *
 * @param layer - The layer to update
 * @param triggers - Whether the features of the layer should trigger a tooltip
 */
export function setLayerTriggersTooltip(layer: OLLayer, triggers = true): void {
  layer.set('triggersTooltip', triggers);
}
