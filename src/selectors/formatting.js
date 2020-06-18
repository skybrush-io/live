/**
 * @file Selectors that return formatter functions for various types of
 * objects on the user interface.
 */

import formatCoords from 'formatcoords';
import { createSelector } from '@reduxjs/toolkit';

import { CoordinateFormat } from '~/model/settings';
import {
  makeDecimalCoordinateFormatter,
  makePolarCoordinateFormatter,
  toPolar,
} from '~/utils/geography';

import { getFlatEarthCoordinateTransformer } from './map';

const cartesianFormatter = makeDecimalCoordinateFormatter({
  digits: 2,
  unit: ' m',
});
const polarFormatter = makePolarCoordinateFormatter({ digits: 2, unit: ' m' });

const signedGeographicFormatter = makeDecimalCoordinateFormatter({
  digits: 7,
  reverse: true,
  separator: ' ',
  unit: '\u00B0',
});

const _formattersForCoordinateFormat = {
  [CoordinateFormat.DEGREES]: ([lon, lat]) =>
    formatCoords(lon, lat, true).format('Xdd', { decimalPlaces: 7 }),
  [CoordinateFormat.DEGREES_MINUTES]: ([lon, lat]) =>
    formatCoords(lon, lat, true).format('XDDmm', { decimalPlaces: 4 }),
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: ([lon, lat]) =>
    formatCoords(lon, lat, true).format('XDDMMss', { decimalPlaces: 3 }),
  [CoordinateFormat.SIGNED_DEGREES]: signedGeographicFormatter,
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: ([lon, lat]) =>
    formatCoords(lon, lat, true).format('-DDmm', { decimalPlaces: 4 }),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]: ([lon, lat]) =>
    formatCoords(lon, lat, true).format('-DDMMss', { decimalPlaces: 3 }),
};

/**
 * Returns the preferred formatter function for the coordinate format
 * specified in the argument.
 *
 * The coordinate format must be a member of the CoordinateFormat enum.
 */
export const getFormatterForCoordinateFormat = (coordinateFormat) =>
  _formattersForCoordinateFormat[coordinateFormat] || signedGeographicFormatter;

/**
 * Selector that returns a function that can be called with longitude-latitde
 * pairs and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredCoordinateFormatter = createSelector(
  (state) => state.settings.display.coordinateFormat,
  getFormatterForCoordinateFormat
);

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system.
 */
export const getFlatEarthCartesianCoordinateFormatter = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformer) => {
    if (transformer !== undefined) {
      return (coords) => cartesianFormatter(transformer.fromLonLat(coords));
    }

    return undefined;
  }
);

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system.
 */
export const getFlatEarthPolarCoordinateFormatter = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformer) => {
    if (transformer !== undefined) {
      return (coords) =>
        polarFormatter(toPolar(transformer.fromLonLat(coords)));
    }

    return undefined;
  }
);

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system,
 * both in Cartesian (X-Y) and polar coordinates.
 */
export const getFlatEarthCombinedCoordinateFormatter = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformer) => {
    if (transformer !== undefined) {
      return (coords) => {
        const transformed = transformer.fromLonLat(coords);
        return (
          cartesianFormatter(transformed) +
          '<br/>' +
          polarFormatter(toPolar(transformed))
        );
      };
    }

    return undefined;
  }
);

/**
 * Selector that returns a coordinate formatter that can be used in contexts
 * where we want to show both the geographical coordinates and the coordinates
 * relative to the origin of the flat Earth coordinate system.
 */
export const getExtendedCoordinateFormatter = createSelector(
  getPreferredCoordinateFormatter,
  getFlatEarthCombinedCoordinateFormatter,
  (geographicFormatter, flatEarthFormatter) => (coords) => {
    const geoCoords = geographicFormatter(coords);

    if (flatEarthFormatter === undefined) {
      return geoCoords;
    }

    return geoCoords + '<br/>' + flatEarthFormatter(coords);
  }
);
