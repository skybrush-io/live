/**
 * @file Defines the singleton instance of the applicaiton-wide signals object.
 */

import Signal from 'mini-signals';
import { boundingExtent, buffer } from 'ol/extent';

import { mapViewCoordinateFromLonLat } from '~/utils/geography';

export const mapReferenceRequestSignal = new Signal();

export const mapRotationResetSignal = new Signal();
export const fitAllFeaturesSignal = new Signal();

export const mapViewToLocationSignal = new Signal();
export const mapViewToExtentSignal = new Signal();

export const focusMessagesDialogUAVSelectorFieldSignal = new Signal();

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
    ...options
  };
  /*
    .map(uav => mapViewCoordinateFromLonLat([uav.lon, uav.lat]))
    .toArray();
  */

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
export function scrollToMapLocation(coordinate, options) {
  const signalOptions = {
    duration: 500,
    ...options
  };

  const coord = coordinateToLonLat(coordinate);

  if (Array.isArray(coord) && coord.length >= 2) {
    mapViewToLocationSignal.dispatch(
      { center: { lon: coord[0], lat: coord[1] } },
      signalOptions
    );
  }
}

export default {
  mapReferenceRequestSignal,

  mapRotationResetSignal,
  fitAllFeaturesSignal,

  mapViewToLocationSignal,
  mapViewToExtentSignal,

  focusMessagesDialogUAVSelectorFieldSignal
};
