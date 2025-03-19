/**
 * @file Selectors that return formatter functions for various types of
 * objects on the user interface.
 */

import { createSelector } from '@reduxjs/toolkit';
import formatCoords from 'formatcoords';

import { CoordinateFormat } from '~/model/settings';
import { DISTANCE_UNITS } from '~/utils/formatting';
import {
  type LonLat,
  makeDecimalCoordinateFormatter,
  makePolarCoordinateFormatter,
  toPolar,
} from '~/utils/geography';

import type { AppSelector, RootState } from '~/store/reducers';
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

export type CoordinateFormatter = (value: number) => string;
export type CoordinatePairFormatter = ([lon, lat]: LonLat) => string;

const _formattersForCoordinateFormat: Record<
  CoordinateFormat,
  CoordinatePairFormatter
> = {
  [CoordinateFormat.DEGREES]: ([lon, lat]) =>
    formatCoords(lat, lon).format('Xdd', { decimalPlaces: 7 }),
  [CoordinateFormat.DEGREES_MINUTES]: ([lon, lat]) =>
    formatCoords(lat, lon).format('XDDmm', { decimalPlaces: 4 }),
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: ([lon, lat]) =>
    formatCoords(lat, lon).format('XDDMMss', { decimalPlaces: 3 }),
  [CoordinateFormat.SIGNED_DEGREES]: signedGeographicFormatter,
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: ([lon, lat]) =>
    formatCoords(lat, lon).format('-DDmm', { decimalPlaces: 4 }),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]: ([lon, lat]) =>
    formatCoords(lat, lon).format('-DDMMss', { decimalPlaces: 3 }),
};

const _formattersForLongitudeOnlyFormat: Record<
  CoordinateFormat,
  (lon: number) => string
> = {
  [CoordinateFormat.DEGREES]: (lon) =>
    formatCoords(0, lon)
      .format('Xdd', { decimalPlaces: 7, latLonSeparator: '|' })
      .split('|')[1]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES]: (lon) =>
    formatCoords(0, lon)
      .format('XDDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[1]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: (lon) =>
    formatCoords(0, lon)
      .format('XDDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[1]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES]: (lon) =>
    signedGeographicFormatter([lon, 0])
      .split(' ')[1]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: (lon) =>
    formatCoords(0, lon)
      .format('-DDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[1]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]: (lon) =>
    formatCoords(0, lon)
      .format('-DDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[1]!
      .replace(trailingZeroRegExp, '$1'),
};

const _formattersForLatitudeOnlyFormat: Record<
  CoordinateFormat,
  (lat: number) => string
> = {
  [CoordinateFormat.DEGREES]: (lat) =>
    formatCoords(lat, 0)
      .format('Xdd', { decimalPlaces: 7, latLonSeparator: '|' })
      .split('|')[0]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES]: (lat) =>
    formatCoords(lat, 0)
      .format('XDDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[0]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: (lat) =>
    formatCoords(lat, 0)
      .format('XDDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[0]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES]: (lat) =>
    signedGeographicFormatter([0, lat])
      .split(' ')[0]!
      .trim()
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: (lat) =>
    formatCoords(lat, 0)
      .format('-DDmm', { decimalPlaces: 4, latLonSeparator: '|' })
      .split('|')[0]!
      .replace(trailingZeroRegExp, '$1'),
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]: (lat) =>
    formatCoords(lat, 0)
      .format('-DDMMss', { decimalPlaces: 3, latLonSeparator: '|' })
      .split('|')[0]!
      .replace(trailingZeroRegExp, '$1'),
};

/**
 * Returns the preferred formatter function for the coordinate format
 * specified in the argument.
 *
 * The coordinate format must be a member of the CoordinateFormat enum.
 */
export const getFormatterForCoordinateFormat = (
  coordinateFormat: CoordinateFormat
): CoordinatePairFormatter =>
  _formattersForCoordinateFormat[coordinateFormat] || signedGeographicFormatter;

/**
 * Returns the preferred latitude formatter function for the coordinate format
 * specified in the argument.
 *
 * The coordinate format must be a member of the CoordinateFormat enum.
 */
export const getLatitudeFormatterForCoordinateFormat = (
  coordinateFormat: CoordinateFormat
): CoordinateFormatter =>
  _formattersForLatitudeOnlyFormat[coordinateFormat] ||
  _formattersForLatitudeOnlyFormat[CoordinateFormat.SIGNED_DEGREES];

/**
 * Returns the preferred longitude formatter function for the coordinate format
 * specified in the argument.
 *
 * The coordinate format must be a member of the CoordinateFormat enum.
 */
export const getLongitudeFormatterForCoordinateFormat = (
  coordinateFormat: CoordinateFormat
): CoordinateFormatter =>
  _formattersForLongitudeOnlyFormat[coordinateFormat] ||
  _formattersForLongitudeOnlyFormat[CoordinateFormat.SIGNED_DEGREES];

/**
 * Selector that returns the preferred coordinate format.
 */
export const getPreferredCoordinateFormat = (
  state: RootState
): CoordinateFormat => state.settings.display.coordinateFormat;

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredCoordinateFormatter: AppSelector<CoordinatePairFormatter> =
  createSelector(getPreferredCoordinateFormat, getFormatterForCoordinateFormat);

/**
 * Selector that returns a function that can be called with a latitude
 * and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredLatitudeCoordinateFormatter: AppSelector<CoordinateFormatter> =
  createSelector(
    getPreferredCoordinateFormat,
    getLatitudeFormatterForCoordinateFormat
  );

/**
 * Selector that returns a function that can be called with a longitude
 * and that returns a nicely formatted representation according to the
 * preferred format of the user.
 */
export const getPreferredLongitudeCoordinateFormatter: AppSelector<CoordinateFormatter> =
  createSelector(
    getPreferredCoordinateFormat,
    getLongitudeFormatterForCoordinateFormat
  );

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system.
 */
export const getFlatEarthCartesianCoordinateFormatter: AppSelector<
  CoordinatePairFormatter | undefined
> = createSelector(getFlatEarthCoordinateTransformer, (transformer) => {
  if (transformer !== undefined) {
    return (coords: LonLat): string =>
      cartesianFormatter(transformer.fromLonLat(coords));
  }

  return undefined;
});

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system.
 */
export const getFlatEarthPolarCoordinateFormatter: AppSelector<
  CoordinatePairFormatter | undefined
> = createSelector(getFlatEarthCoordinateTransformer, (transformer) => {
  if (transformer !== undefined) {
    return (coords: LonLat): string =>
      polarFormatter(toPolar(transformer.fromLonLat(coords)));
  }

  return undefined;
});

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system,
 * both in Cartesian (X-Y) and polar coordinates.
 */
export const getFlatEarthCombinedCoordinateFormatter: AppSelector<
  CoordinatePairFormatter | undefined
> = createSelector(getFlatEarthCoordinateTransformer, (transformer) => {
  if (transformer !== undefined) {
    return (coords: LonLat): string => {
      const transformed = transformer.fromLonLat(coords);
      return (
        cartesianFormatter(transformed) +
        '<br/>' +
        polarFormatter(toPolar(transformed))
      );
    };
  }

  return undefined;
});

/**
 * Selector that returns a coordinate formatter that can be used in contexts
 * where we want to show both the geographical coordinates and the coordinates
 * relative to the origin of the flat Earth coordinate system.
 */
export const getExtendedCoordinateFormatter: AppSelector<CoordinatePairFormatter> =
  createSelector(
    getPreferredCoordinateFormatter,
    getFlatEarthCombinedCoordinateFormatter,
    (geographicFormatter, flatEarthFormatter) =>
      (coords: LonLat): string => {
        const geoCoords = geographicFormatter(coords);

        if (flatEarthFormatter === undefined) {
          return geoCoords;
        }

        return geoCoords + '<br/>' + flatEarthFormatter(coords);
      }
  );
