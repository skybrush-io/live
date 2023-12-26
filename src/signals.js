/**
 * @file Defines the singleton instance of the applicaiton-wide signals object.
 */

import { MiniSignal } from 'mini-signals';
import { boundingExtent, buffer } from 'ol/extent';

import { mapViewCoordinateFromLonLat } from '~/utils/geography';

export const mapReferenceRequestSignal = new MiniSignal();

export const mapRotationResetSignal = new MiniSignal();
export const fitAllFeaturesSignal = new MiniSignal();

export const mapViewToLocationSignal = new MiniSignal();
export const mapViewToExtentSignal = new MiniSignal();

/**
 * Converts an object that is either an array of at least length 2 or an object
 * with keys `lon` and `lat` to a longitude-latitude pair.
 */
function coordinateToLonLat(coordinate) {
  if (Array.isArray(coordinate) && coordinate.length >= 2) {
    return coordinate.slice(0, 2);
  }

  return [coordinate.lon, coordinate.lat];
}

/**
 * Convenience function to scroll and zoom the map to ensure that a given
 * list of coordinates all fit into the view, with reasonable defaults.
 */
export function fitCoordinatesIntoMapView(coordinates, options) {
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
export function scrollToMapLocation(coordinate, options = {}) {
  const { rotation, zoom, ...rest } = options;
  const signalOptions = {
    duration: 500,
    ...rest,
  };

  const coord = coordinateToLonLat(coordinate);

  if (Array.isArray(coord) && coord.length >= 2) {
    const signalArgs = {
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
}

const signals = {
  mapReferenceRequestSignal,

  mapRotationResetSignal,
  fitAllFeaturesSignal,

  mapViewToLocationSignal,
  mapViewToExtentSignal,
};

export default signals;
