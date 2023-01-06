/**
 * @file Selectors that return formatter functions for various types of
 * objects on the user interface.
 */

import formatCoords from 'formatcoords';
import { createSelector } from '@reduxjs/toolkit';

import { CoordinateFormat } from '~/model/settings';
import { DISTANCE_UNITS } from '~/utils/formatting';
import {
  makeDecimalCoordinateFormatter,
  makePolarCoordinateFormatter,
  toPolar,
} from '~/utils/geography';

import { getFlatEarthCoordinateTransformer } from './map';

const trailingZeroRegExp = /\.?0+([°′″'"]?)$/;

const cartesianFormatter = makeDecimalCoordinateFormatter({
  digits: 2,
  unit: DISTANCE_UNITS,
});

const polarFormatter = makePolarCoordinateFormatter({
  digits: 2,
  unit: DISTANCE_UNITS,
});

const signedGeographicFormatter = makeDecimalCoordinateFormatter({
  digits: 7,
  reverse: true,
  separator: ' ',
  unit: '°',
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

const _formattersForLongitudeOnlyFormat = {
  [CoordinateFormat.DEGREES]: (lon) =>
    formatCoords(lon, 0, true)
      .format('Xdd', { decimalPlaces: 7, latLonSeparator: '|' })
      .split('|')[1]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES]: (lon) =>
    formatCoords(lon, 0, true)
      .format('XDDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[1]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: (lon) =>
    formatCoords(lon, 0, true)
      .format('XDDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[1]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES]: (lon) =>
    signedGeographicFormatter([lon, 0])
      .split(' ')[1]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: (lon) =>
    formatCoords(lon, 0, true)
      .format('-DDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[1]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]: (lon) =>
    formatCoords(lon, 0, true)
      .format('-DDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[1]
      .replace(trailingZeroRegExp, '$1'),
};

const _formattersForLatitudeOnlyFormat = {
  [CoordinateFormat.DEGREES]: (lat) =>
    formatCoords(0, lat, true)
      .format('Xdd', { decimalPlaces: 7, latLonSeparator: '|' })
      .split('|')[0]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES]: (lat) =>
    formatCoords(0, lat, true)
      .format('XDDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[0]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: (lat) =>
    formatCoords(0, lat, true)
      .format('XDDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[0]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES]: (lat) =>
    signedGeographicFormatter([0, lat])
      .split(' ')[0]
      .trim()
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: (lat) =>
    formatCoords(0, lat, true)
      .format('-DDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[0]
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]: (lat) =>
    formatCoords(0, lat, true)
      .format('-DDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[0]
      .replace(trailingZeroRegExp, '$1'),
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
 * Returns the preferred latitude formatter function for the coordinate format
 * specified in the argument.
 *
 * The coordinate format must be a member of the CoordinateFormat enum.
 */
export const getLatitudeFormatterForCoordinateFormat = (coordinateFormat) =>
  _formattersForLatitudeOnlyFormat[coordinateFormat] ||
  _formattersForLatitudeOnlyFormat[CoordinateFormat.SIGNED_DEGREES];

/**
 * Returns the preferred longitude formatter function for the coordinate format
 * specified in the argument.
 *
 * The coordinate format must be a member of the CoordinateFormat enum.
 */
export const getLongitudeFormatterForCoordinateFormat = (coordinateFormat) =>
  _formattersForLongitudeOnlyFormat[coordinateFormat] ||
  _formattersForLongitudeOnlyFormat[CoordinateFormat.SIGNED_DEGREES];

/**
 * Selector that returns the preferred coordinate format.
 */
export const getPreferredCoordinateFormat = (state) =>
  state.settings.display.coordinateFormat;

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredCoordinateFormatter = createSelector(
  getPreferredCoordinateFormat,
  getFormatterForCoordinateFormat
);

/**
 * Selector that returns a function that can be called with a latitude
 * and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredLatitudeCoordinateFormatter = createSelector(
  getPreferredCoordinateFormat,
  getLatitudeFormatterForCoordinateFormat
);

/**
 * Selector that returns a function that can be called with a longitude
 * and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredLongitudeCoordinateFormatter = createSelector(
  getPreferredCoordinateFormat,
  getLongitudeFormatterForCoordinateFormat
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
