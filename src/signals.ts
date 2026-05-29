/**
 * @file Defines the singleton instance of the application-wide signals object.
 */

import { MiniSignal } from 'mini-signals';
import type { Extent } from 'ol/extent';
import { boundingExtent, buffer } from 'ol/extent';
import type Map from 'ol/Map';

import {
  mapViewCoordinateFromLonLat,
  type LatLonObject,
  type LonLat,
} from '~/utils/geography';

export const mapReferenceRequestSignal = new MiniSignal<
  [(map: Map) => void | Promise<void>]
>();

export const fitAllFeaturesSignal = new MiniSignal<[]>();

export type MapViewLocation = {
  center?: LatLonObject;
  rotation?: number | string;
  zoom?: number | string;
};

export type MapViewAnimationOptions = {
  duration?: number;
  padding?: number | number[];
};

export const mapViewToLocationSignal = new MiniSignal<
  [MapViewLocation, MapViewAnimationOptions]
>();

export const mapViewToExtentSignal = new MiniSignal<
  [Extent, MapViewAnimationOptions]
>();

/**
 * Input coordinates that can be either a {@link LonLat} tuple
 * or a {@link LatLonObject}.
 */
type CoordinateLike = LonLat | LatLonObject;

/**
 * Converts an object that is either an array of at least length 2 or an object
 * with keys `lon` and `lat` to a longitude-latitude pair.
 */
function coordinateToLonLat(coordinate: CoordinateLike): LonLat {
  if (Array.isArray(coordinate)) {
    return [coordinate[0], coordinate[1]];
  }

  return [coordinate.lon, coordinate.lat];
}

/**
 * Convenience function to scroll and zoom the map to ensure that a given
 * list of coordinates all fit into the view, with reasonable defaults.
 */
export function fitCoordinatesIntoMapView(
  coordinates: CoordinateLike[],
  options: MapViewAnimationOptions & { margin?: number } = {}
) {
  const { margin, ...rest } = {
    margin: 16,
    duration: 500,
    ...options,
  };

  const bounds = boundingExtent(
    coordinates.map((coord) =>
      mapViewCoordinateFromLonLat(coordinateToLonLat(coord))
    )
  );
  const bufferedBounds = margin && margin > 0 ? buffer(bounds, margin) : bounds;
  mapViewToExtentSignal.dispatch(bufferedBounds, rest);
}

/**
 * Convenience function to scroll the map to a given latitude and longitude
 * with reasonable defaults.
 *
 * @param  {object}  coordinate  the coordinate to scroll to. It must be either
 *         an object with keys `lon` and `lat` (for longitude and latitde,
 *         respectively), or an array of length 2; in this case, longitude
 *         comes first and latitude comes second, according to OpenLayers
 *         conventions.
 */
export function scrollToMapLocation(
  coordinate: CoordinateLike,
  options: MapViewAnimationOptions & { rotation?: number; zoom?: number } = {}
) {
  const { rotation, zoom, ...rest } = options;
  const signalOptions: MapViewAnimationOptions = {
    duration: 500,
    ...rest,
  };

  const coord = coordinateToLonLat(coordinate);

  const signalArgs: MapViewLocation = {
    center: {
      lon: coord[0],
      lat: coord[1],
    },
  };

  if (Number.isFinite(rotation)) {
    signalArgs.rotation = Number(rotation).toFixed(1);
  }

  if (Number.isFinite(zoom)) {
    signalArgs.zoom = Number(zoom).toFixed(1);
  }

  mapViewToLocationSignal.dispatch(signalArgs, signalOptions);
}

const signals = {
  mapReferenceRequestSignal,

  fitAllFeaturesSignal,

  mapViewToLocationSignal,
  mapViewToExtentSignal,
};

export default signals;
