import { isObject } from 'lodash-es';

import { type Latitude, type Longitude } from '~/utils/geography';

import { type GPSFixType } from './enums';

/* ----- Position ----------------------------------------------------------- */

export type GPSFix = {
  type: GPSFixType;
  numSatellites?: number;
  horizontalAccuracy?: number;
  verticalAccuracy?: number;
};

export type GPSPosition = {
  lat: Latitude;
  lon: Longitude;
  amsl?: number;
  ahl?: number;
  agl?: number;
};

/**
 * Returns whether the given GPS position is the null island.
 */
const isNullIsland = (pos: GPSPosition): boolean =>
  pos.lat === 0 && pos.lon === 0;

/**
 * Returns whether the given input represents a valid position.
 */
export const isGPSPosition = (position: unknown): position is GPSPosition =>
  // prettier-ignore
  isObject(position)
  && ( ('lat'  in position) && typeof position.lat  === 'number')
  && ( ('lon'  in position) && typeof position.lon  === 'number')
  && (!('amsl' in position) || typeof position.amsl === 'number')
  && (!('ahl'  in position) || typeof position.ahl  === 'number')
  && (!('agl'  in position) || typeof position.agl  === 'number')
  && !isNullIsland(position as GPSPosition);

/**
 * Return whether the given (optional) GPS position is valid, meaning it is not
 * `undefined` or `null` and not the null island.
 */
export const isGPSPositionValid = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  pos: GPSPosition | undefined | null
): pos is GPSPosition =>
  pos !== undefined && pos !== null && !isNullIsland(pos);

/* ----- Heading ------------------------------------------------------------ */

/**
 * Enum containing the possible heading mode types that we support.
 */
export enum HeadingMode {
  ABSOLUTE = 'absolute',
  WAYPOINT = 'waypoint',
}

/**
 * Type specification for a heading object containing a numeric value and a
 * heading mode.
 */
export type Heading = {
  mode: HeadingMode;
  value: number;
};

/**
 * Returns whether the given input represents a valid heading specification.
 */
export const isHeading = (heading: unknown): heading is Heading =>
  // prettier-ignore
  isObject(heading)
  // `mode` is a valid heading mode
  && ('mode' in heading)
  && typeof heading.mode === 'string'
  && Object.values(HeadingMode).includes(heading.mode as HeadingMode)
  // `value` is a finite number
  && ('value' in heading)
  && typeof heading.value === 'number'
  && Number.isFinite(heading.value);

/* ----- Altitude ----------------------------------------------------------- */

/**
 * Enum containing the possible altitude reference types that we support.
 */
export enum AltitudeReference {
  GROUND = 'ground',
  HOME = 'home',
  MSL = 'msl',
}

/**
 * Type specification for an altitude object containing a numeric offset from an
 * altitude reference.
 */
export type Altitude = {
  reference: AltitudeReference;
  value: number;
};

/**
 * Returns whether the given input represents a valid altitude specification.
 */
export const isAltitude = (altitude: unknown): altitude is Altitude =>
  // prettier-ignore
  isObject(altitude)
  // `reference` is a valid altitude reference
  && 'reference' in altitude
  && typeof altitude.reference === 'string'
  && Object.values(AltitudeReference).includes(
    altitude.reference as AltitudeReference
  )
  // `value` is a finite number
  && 'value' in altitude
  && typeof altitude.value === 'number'
  && Number.isFinite(altitude.value);
