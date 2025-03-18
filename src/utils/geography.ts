/* eslint-disable import/no-duplicates */
/**
 * @file Geography-related utility functions and variables.
 */

import * as CoordinateParser from 'coordinate-parser';
import curry from 'lodash-es/curry';
import isNil from 'lodash-es/isNil';
import minBy from 'lodash-es/minBy';
import unary from 'lodash-es/unary';
import { err, ok, type Result } from 'neverthrow';
import * as Coordinate from 'ol/coordinate';
import * as Extent from 'ol/extent';
import type OLFeature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import {
  type Geometry,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from 'ol/geom';
import GeometryCollection from 'ol/geom/GeometryCollection';
import { type GeometryFunction } from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import type Map from 'ol/Map';
import * as Projection from 'ol/proj';
import type RenderFeature from 'ol/render/Feature';
import VectorSource from 'ol/source/Vector';
import { getArea, getLength } from 'ol/sphere';
import { type Vector3 } from 'three';
import turfBuffer from '@turf/buffer';
import turfDifference from '@turf/difference';
import turfDistance from '@turf/distance';
import * as TurfHelpers from '@turf/helpers';

import { type Feature, FeatureType } from '~/model/features';
import {
  type Altitude,
  AltitudeReference,
  type Heading,
  HeadingMode,
} from '~/model/geography';

import {
  formatArea,
  formatDistance,
  formatNumberAndUnit,
  type UnitDescriptor,
} from './formatting';
import {
  type Coordinate2D,
  type Coordinate3D,
  createGeometryFromPoints,
  euclideanDistance2D,
  isCoordinate2D,
  toDegrees,
  toRadians,
} from './math';
import { isRunningOnMac } from './platform';

// TODO: Define better types for coordinates?
// (Partially solved on 2023-08-12.)
// (Further improved on 2025-02-18.)
//
// The one provided by OpenLayers is too generic (`Array<number>` instead
// of [number, number]), while their docs do specify _"an `xy` coordinate"_.
// https://openlayers.org/en/v7.4.0/apidoc/module-ol_coordinate.html#~Coordinate
//
// The docs were wrong: https://github.com/openlayers/openlayers/pull/14994
// The following type could still be more accurate than `Array<number>`:
// [number, number] | [number, number, number] | [number, numbe, number, number]
//
// Also, maybe create separate types for LonLat and LatLon where it matters?
// While we're at it, perhaps even `AHL`, `AGL` and other distinct measures
// with the `unique symbol` trick?
// https://github.com/Microsoft/TypeScript/issues/364#issuecomment-719046161

const _Longitude: unique symbol = Symbol('Longitude');
export type Longitude = number & { [_Longitude]: void };

const _Latitude: unique symbol = Symbol('Latitude');
export type Latitude = number & { [_Latitude]: void };

export type LonLat = [Longitude, Latitude];
export type LatLon = [Latitude, Longitude];

const _Easting: unique symbol = Symbol('Easting');
export type Easting = number & { [_Easting]: void };

const _Northing: unique symbol = Symbol('Northing');
export type Northing = number & { [_Northing]: void };

export type EasNor = [Easting, Northing];
export type NorEas = [Northing, Easting];

// The angle sign spams lots of CoreText-related warnings in the console when
// running under Electron on macOS, so we use the @ sign there as a replacement.
// Windows and Linux seem to be okay with the angle sign;
const ANGLE_SIGN = isRunningOnMac ? '@' : '∠';

/**
 * Returns the (initial) bearing when going from one point to another on a
 * sphere along a great circle.
 *
 * The spherical coordinates must be specified in degrees, in longitude-latitude
 * order.
 *
 * @param first - The first point
 * @param second - The second point
 * @returns Bearing, in degrees, in the [0; 360) range
 */
export function bearing(first: LonLat, second: LonLat): number {
  const lonDiff = toRadians(second[0] - first[0]);
  const firstLatRadians = toRadians(first[1]);
  const secondLatRadians = toRadians(second[1]);
  const y = Math.sin(lonDiff) * Math.cos(secondLatRadians);
  const x =
    Math.cos(firstLatRadians) * Math.sin(secondLatRadians) -
    Math.sin(firstLatRadians) * Math.cos(secondLatRadians) * Math.cos(lonDiff);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Returns the final bearing when going from one point to another on a
 * sphere along a great circle.
 *
 * The spherical coordinates must be specified in degrees, in longitude-latitude
 * order.
 *
 * @param first - The first point
 * @param second - The second point
 * @returns Bearing, in degrees, in the [0; 360) range
 */
export function finalBearing(first: LonLat, second: LonLat): number {
  const angle = bearing(second, first);
  return (angle + 180) % 360;
}

/**
 * Creates an OpenLayers geometry function used by the "draw" interaction
 * to draw a box whose sides are parallel to axes obtained by rotating the
 * principal axes with the given angle.
 *
 * @param angle - The rotation angle of the axes or
 *                a function that returns the angle when invoked
 * @returns The geometry function
 */
export const createRotatedBoxGeometryFunction =
  (angle: number | (() => number)): GeometryFunction =>
  (coordinates, optGeometry) => {
    if (
      coordinates.length !== 2 ||
      !isCoordinate2D(coordinates[0]) ||
      !isCoordinate2D(coordinates[1])
    ) {
      throw new TypeError('Must be called with two points only');
    }

    // Get the effective angle
    const effectiveAngle = typeof angle === 'number' ? angle : angle();

    // Translate the rectangle spanned by the two coordinates
    // such that its center is at the origin, then undo the rotation
    // of the map
    const [a, b] = coordinates;
    const mid: Coordinate2D = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const newA = Coordinate.rotate(
      [a[0] - mid[0], a[1] - mid[1]],
      effectiveAngle
    );
    const newB = Coordinate.rotate(
      [b[0] - mid[0], b[1] - mid[1]],
      effectiveAngle
    );

    // Get the extents of the rectangle, get the four
    // corners and then rotate and translate them back
    const extent = Extent.boundingExtent([newA, newB]);
    const newCoordinates = [
      Extent.getBottomLeft(extent),
      Extent.getBottomRight(extent),
      Extent.getTopRight(extent),
      Extent.getTopLeft(extent),
      Extent.getBottomLeft(extent),
    ].map((coordinate) =>
      Coordinate.add(Coordinate.rotate(coordinate, -effectiveAngle), mid)
    );

    if (optGeometry) {
      optGeometry.setCoordinates([newCoordinates]);
      return optGeometry;
    }

    return new Polygon([newCoordinates]);
  };

/**
 * Finds a single feature with a given global ID on all layers of an
 * OpenLayers map.
 *
 * @param map - The OpenLayers map
 * @param featureId - The ID of the feature to look for
 * @returns The OpenLayers feature or undefined if there is
 *          no such feature on any of the visible layers
 */
export const findFeatureById = curry(
  (map: Map, featureId: string): OLFeature | RenderFeature[] | undefined => {
    return findFeaturesById(map, [featureId])[0];
  }
);

const isVectorLayer = (layer: unknown): layer is VectorLayer<FeatureLike> =>
  layer instanceof VectorLayer && layer.getSource() instanceof VectorSource;

/**
 * Finds the features corresponding to an array of feature IDs on the given
 * OpenLayers map.
 *
 * @param map - The OpenLayers map
 * @param featureIds - The global IDs of the features
 * @returns An array of OpenLayers features corresponding to the
 *          given feature IDs; the array might contain undefined
 *          entries for features that are not found on the map
 */
export const findFeaturesById = curry(
  (map: Map, featureIds: string[]): Array<OLFeature | RenderFeature[]> => {
    const features: Array<OLFeature | RenderFeature[]> = Array.from({
      length: featureIds.length,
    });

    for (const layer of map.getLayers().getArray()) {
      if (!isVectorLayer(layer) || !layer.getVisible()) {
        continue;
      }

      const source = layer.getSource();

      if (!source) {
        continue;
      }

      for (const [i, featureId] of featureIds.entries()) {
        if (!features[i]) {
          const feature = source.getFeatureById(featureId);
          if (feature) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            features[i] = feature as any;
          }
        }
      }
    }

    return features;
  }
);

/**
 * Returns the closest point of a geometry from the given OpenLayers
 * coordinates.
 *
 * Note that this function is different from `ol.geom.Geometry.getClosestPoint()`:
 * when the coordinate is contained in the given geometry, it will return the
 * coordinate itself instead of finding the closest point on the boundary.
 *
 * @param geometry - The geometry
 * @param coordinate - The point to consider
 * @returns The coordinates of the closest point of the given geometry
 */
export const getExactClosestPointOf = (
  geometry: Geometry,
  coordinate: Coordinate2D
): Coordinate2D => {
  // Special case: if the coordinate is in the geometry, the closest point
  // to it is itself
  if (geometry.intersectsCoordinate(coordinate)) {
    return coordinate;
  }

  // For geometry collections, recurse into the sub-geometries and return
  // the closest point of the closest geometry.
  // For multi-linestrings, recurse into the sub-linestrings and return
  // the closest point of the closest linestring
  // For multi-polygons, recurse into the sub-polygons and return
  // the closest point of the closest polygon.
  let subGeometries;
  if (geometry instanceof GeometryCollection) {
    subGeometries = geometry.getGeometries();
  } else if (geometry instanceof MultiPolygon) {
    subGeometries = geometry.getPolygons();
  } else if (geometry instanceof MultiLineString) {
    subGeometries = geometry.getLineStrings();
  }

  if (subGeometries !== undefined) {
    const closestPoints = subGeometries.map((subGeometry) =>
      getExactClosestPointOf(subGeometry, coordinate)
    );

    const closestPoint = minBy(closestPoints, (point) =>
      euclideanDistance2D.bind(coordinate, point)
    );

    // Failing with `[NaN, NaN]` matches the behavior of `getClosestPoint()`
    return closestPoint ?? [Number.NaN, Number.NaN];
  }

  // For anything else, just fall back to getClosestPoint()
  // NOTE: Type assertion justified by `getClosestPoint` being implemented in 2D
  return geometry.getClosestPoint(coordinate) as Coordinate2D;
};

/**
 * Creates a function that formats an OpenLayers coordinate into the
 * usual decimal latitude-longitude representation with the given number
 * of fractional digits.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 *
 * @param options - Formatting options
 * @param options.digits - The number of fractional digits to show
 * @param options.reverse - Whether to reverse the X and Y coordinates
 * @param options.separator - Separator between the X and Y coordinates
 * @param options.unit - The unit to show after the digits
 * @returns The constructed function
 */
export const makeDecimalCoordinateFormatter = ({
  digits,
  reverse = false,
  separator = ', ',
  unit,
}: {
  digits?: number;
  reverse?: boolean;
  separator?: string;
  unit?: string | UnitDescriptor[];
}): ((coordinate: Coordinate2D) => string) => {
  const indices: [0 | 1, 0 | 1] = reverse ? [1, 0] : [0, 1];
  return (coordinate) => {
    if (coordinate) {
      return (
        formatNumberAndUnit(coordinate[indices[0]], unit, digits) +
        separator +
        formatNumberAndUnit(coordinate[indices[1]], unit, digits)
      );
    } else {
      return '';
    }
  };
};

/**
 * Creates a function that formats an OpenLayers polar coordinate pair into
 * a nice human-readable representation with the given number of fractional
 * digits.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 *
 * @param options - Formatting options
 * @param options.digits - The number of fractional digits to show
 * @param options.unit - The unit to show after the digits
 * @returns The constructed function
 */
export const makePolarCoordinateFormatter =
  ({ digits, unit }: { digits?: number; unit?: string | UnitDescriptor[] }) =>
  (coordinate: Coordinate2D): string => {
    if (coordinate) {
      return (
        formatNumberAndUnit(coordinate[0], unit, digits) +
        ` ${ANGLE_SIGN} ` +
        formatNumberAndUnit(coordinate[1], '°', digits)
      );
    } else {
      return '';
    }
  };

/**
 * Creates a function that measures an internal representation of a feature.
 * (Area for Polygons, length for LineStrings.)
 *
 * @param feature - The subject of the measurement
 * @returns The resulting measurement in string form with units included
 */
export const measureFeature = (feature: Feature): string => {
  switch (feature.type) {
    case FeatureType.LINE_STRING: {
      const length = getLength(
        new LineString(feature.points.map(unary(mapViewCoordinateFromLonLat)))
      );

      return formatDistance(length);
    }

    case FeatureType.POLYGON: {
      // NOTE: `polygon.getArea()` doesn't include correction for the projection
      const area = getArea(
        new Polygon(
          [feature.points, ...(feature.holes ?? [])].map((coordinates) =>
            coordinates.map(unary(mapViewCoordinateFromLonLat))
          )
        )
      );

      return formatArea(area);
    }

    default:
      throw new Error('Unsupported feature type to measure: ' + feature.type);
  }
};

/**
 * Merges an array of OpenLayer extents and returns
 * a single extent that contains all of them.
 *
 * @param extents - The extents to merge
 * @returns The merged OpenLayers extent
 */
export function mergeExtents(extents: Extent.Extent[]): Extent.Extent {
  const result = Extent.createEmpty();

  for (const extent of extents) {
    Extent.extend(result, extent);
  }

  return result;
}

/**
 * Normalizes an angle given in degrees according to the conventions used in
 * the app.
 *
 * The conventions are: the angle is always between 0 (inclusive) and 360
 * (exclusive), rounded to 1 decimal digit.
 *
 * @param angle - The input angle
 * @returns The normalized angle as a string to avoid rounding errors
 */
export const normalizeAngle = (angle: number): string =>
  (((angle % 360) + 360) % 360).toFixed(1);

export const translateBy = curry(
  (displacement: [number, number], coordinates: Array<[number, number]>) => {
    const dx = displacement[0];
    const dy = displacement[1];
    if (dx === 0 && dy === 0) {
      return coordinates;
    }

    return coordinates.map((coordinate) => [
      coordinate[0] + dx,
      coordinate[1] + dy,
    ]);
  }
);

const createSafeWrapper =
  <S, T>(func: (value: S) => T) =>
  (value: S, defaultValue: T): T => {
    if (isNil(value)) {
      return defaultValue;
    }

    try {
      return func(value);
    } catch {
      return defaultValue;
    }
  };

/**
 * Formats the given altitude-with-reference object in a way that is suitable
 * for presentation on the UI.
 */
export const formatAltitudeWithReference = (altitude: Altitude): string => {
  const { reference, value } = altitude;
  const formattedValue = formatDistance(value);

  switch (reference) {
    case AltitudeReference.MSL: {
      return formattedValue + ' AMSL';
    }

    case AltitudeReference.HOME: {
      return formattedValue + ' above home';
    }

    case AltitudeReference.GROUND: {
      return formattedValue + ' above ground';
    }

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    default: {
      return `${formattedValue} above unknown reference: ${String(reference)}`;
    }
  }
};

/**
 * Formats the given altitude-with-reference object in a way that is suitable
 * for presentation on the UI, ensuring that falsy values are replaced with a
 * default value.
 */
export const safelyFormatAltitudeWithReference = createSafeWrapper(
  formatAltitudeWithReference
);

/**
 * Formats the given heading-with-mode object in a way that is suitable
 * for presentation on the UI.
 */
export const formatHeadingWithMode = (heading: Heading): string => {
  const { mode, value } = heading;
  const formattedValue = value.toFixed(1) + '\u00B0';

  if (mode === HeadingMode.WAYPOINT) {
    return 'Always face next waypoint';
  } else if (mode === HeadingMode.ABSOLUTE) {
    return formattedValue;
  } else {
    return `${formattedValue} @ unknown mode: ${String(mode)}`;
  }
};

export const safelyFormatHeadingWithMode = createSafeWrapper(
  formatHeadingWithMode
);

/**
 * Formats the given OpenLayers coordinate into the usual latitude-longitude
 * representation in a format suitable for the UI.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 */
export const formatCoordinate = makeDecimalCoordinateFormatter({
  digits: 7,
  reverse: true,
  unit: '°',
});

export const safelyFormatCoordinate = (coordinate?: Coordinate2D): string => {
  if (isNil(coordinate)) {
    return '';
  }

  try {
    return formatCoordinate(coordinate);
  } catch {
    return '';
  }
};

/**
 * Parses the given string as geographical coordinates and converts it into
 * OpenLayers format (longitude first).
 *
 * @param text - The text to parse
 * @returns The parsed coordinates in OpenLayers format
 *          or undefined in case of a parsing error
 */
export const parseCoordinate = (text: string): LonLat | undefined => {
  try {
    const parsed = new CoordinateParser(text);
    return [
      // NOTE: Type assertions justified by the `coordinate-parser` library
      parsed.getLongitude() as Longitude,
      parsed.getLatitude() as Latitude,
    ];
  } catch {
    return undefined;
  }
};

type EllipsoidModel = {
  eccentricity: number;
  eccentricitySquared: number;
  flattening: number;
  inverseFlattening: number;
  meanRadius: number;
  semiMajorAxis: number;
  semiMinorAxis: number;
};

/**
 * Function that creates an object holding the standard properties of an
 * ellipsoid model from the length of the semi-major axis and the inverse
 * flattening.
 *
 * @param semiMajorAxis - The length of the semi-major axis
 * @param inverseFlattening - The inverse flattening of the ellipsoid;
 *                            use Number.POSITIVE_INFINITY for perfect spheres
 * @returns An object holding the standard properties of the given ellipsoid
 */
const makeEllipsoidModel = (
  semiMajorAxis: number,
  inverseFlattening: number
): EllipsoidModel => {
  const flattening = 1 / inverseFlattening;
  const eccentricitySquared = flattening * (2 - flattening);
  const eccentricity = Math.sqrt(eccentricitySquared);
  const semiMinorAxis = semiMajorAxis * (1 - flattening);
  const meanRadius = (semiMinorAxis + semiMajorAxis * 2) / 3;

  return Object.freeze({
    eccentricity,
    eccentricitySquared,
    flattening,
    inverseFlattening,
    meanRadius,
    semiMajorAxis,
    semiMinorAxis,
  });
};

/**
 * Object holding details about the WGS84 ellipsoid model.
 */
export const WGS84 = makeEllipsoidModel(6378137, 298.257223563);

/*
 * The default value for projection is "EPSG:3857", a Spherical Mercator
 * projection used by most tile-based mapping services.
 *
 * The values of "WGS 84" ("EPSG:4326") range from [-180, -90] to [180, 90]
 * as seen here. @see https://epsg.io/4326
 *
 * The values of "EPSG:3857" range from [-20026376.39 -20048966.10]
 * to [20026376.39 20048966.10] and cover "WGS 84" from [-180.0 -85.06]
 * to [180.0 85.06] as seen here. @see https://epsg.io/3857
 */

/**
 * Helper function to convert a longitude-latitude pair to the coordinate
 * system used by the map view.
 *
 * Longitudes and latitudes are assumed to be given in WGS 84.
 *
 * TODO: Maybe we should establish a fixed projection with `unary` right
 *       here instead of every time this is used to `map` over an array?
 *
 * @param coordinate - The longitude and latitude, in this order
 * @param projection - The projection to use for the conversion
 * @returns The OpenLayers coordinates corresponding
 *          to the given longitude-latitude pair
 */
export const mapViewCoordinateFromLonLat = Projection.fromLonLat as {
  // Precisely typed case, specific for exact coordinate types
  (coordinates: LonLat, projection?: Projection.ProjectionLike): EasNor;
  // Special case for two dimensions, generic in terms of coordinate types
  (
    coordinates: Coordinate2D,
    projection?: Projection.ProjectionLike
  ): Coordinate2D;
  // Original type, generic in terms of dimensions and coordinate types
  (
    coordinates: Coordinate.Coordinate,
    projection?: Projection.ProjectionLike
  ): Coordinate.Coordinate;
};

/**
 * Helper function to convert a coordinate from the map view into a
 * longitude-latitude pair.
 *
 * Coordinates are assumed to be given in EPSG:3857.
 *
 * TODO: Maybe we should establish a fixed projection with `unary` right
 *       here instead of every time this is used to `map` over an array?
 *
 * @param coordinate - The OpenLayers coordinate
 * @param projection - The projection to use for the conversion
 * @returns The longtitude-latitude pair corresponding
 *          to the given OpenLayers coordinates
 */
export const lonLatFromMapViewCoordinate = Projection.toLonLat as {
  // Precisely typed case, specific for exact coordinate types
  (coordinates: EasNor, projection?: Projection.ProjectionLike): LonLat;
  // Special case for two dimensions, generic in terms of coordinate types
  (
    coordinates: Coordinate2D,
    projection?: Projection.ProjectionLike
  ): Coordinate2D;
  // Original type, generic in terms of dimensions and coordinate types
  (
    coordinates: Coordinate.Coordinate,
    projection?: Projection.ProjectionLike
  ): Coordinate.Coordinate;
};

/**
 * Helper function to move a longitude-latitude coordinate pair by a vector
 * expressed in map view coordinates.
 */
export const translateLonLatWithMapViewDelta = (
  origin: LonLat,
  delta: EasNor
): LonLat => {
  const originInMapView = mapViewCoordinateFromLonLat(origin);

  return lonLatFromMapViewCoordinate([
    // NOTE: Type assertion justfied by the summing of homogeneous coordinates
    (originInMapView[0] + delta[0]) as Easting,
    (originInMapView[1] + delta[1]) as Northing,
  ]);
};

/**
 * Class that defines a flat-Earth coordinate system centered at a given
 * spherical coordinate.
 *
 * TODO: Make private fields and methods properly private (#) when we're sure
 * that it doesn't break anything.
 */
export class FlatEarthCoordinateSystem {
  _vec: Coordinate3D = [0, 0, 0]; // dummy vector used to avoid allocations
  _origin: LonLat;
  _orientation: number;
  _ellipsoid: EllipsoidModel;
  _type: string;

  // NOTE: Bangs are justified by `this._precalculate()` setting these values.
  // See canonical issue: https://github.com/microsoft/TypeScript/issues/21132
  _piOver180!: number;
  _r1!: number;
  _r2OverCosOriginLatInRadians!: number;
  _yMul!: number;

  /**
   * Constructor.
   *
   * @param options
   * @param options.origin - The longitude-latitude pair that defines
   *                         the origin of the coordinate system
   * @param options.orientation -
   *          The orientation of the zero-degree axis of the coordinate system,
   *          in degrees, zero being north, 90 degrees being east,
   *          180 degrees being south and 270 degrees being west.
   * @param options.type -
   *          Type of the axis configuration of the flat Earth coordinate
   *          system: `neu` means that the coordinate system is left-handed
   *          (north-east-up) `nwu` means that the coordinate system is
   *          right-handed (north-west-up)
   * @param options.ellipsoid - The model of the ellipsoid on which the
   *                            coordinate system is defined; defaults to WGS84
   */
  constructor({
    origin,
    orientation = 0,
    type = 'neu',
    ellipsoid = WGS84,
  }: {
    origin: LonLat;
    orientation?: number | string;
    type?: string;
    ellipsoid?: EllipsoidModel;
  }) {
    if (type !== 'neu' && type !== 'nwu') {
      throw new Error('unknown coordinate system type: ' + type);
    }

    if (typeof orientation !== 'number') {
      orientation = Number.parseFloat(orientation);
    }

    if (Number.isNaN(orientation)) {
      throw new TypeError('invalid orientation');
    }

    this._vec = [0, 0, 0]; // dummy vector used to avoid allocations
    this._origin = origin;
    this._orientation = toRadians(orientation);
    this._ellipsoid = ellipsoid;
    this._type = type;
    this._precalculate();
  }

  /**
   * Converts a longitude-latitude pair to flat Earth coordinates.
   *
   * @param coords - A longitude-latitude pair to convert
   * @returns The converted coordinates
   */
  fromLonLat(coords: LonLat): Coordinate2D {
    const result: Coordinate2D = [0, 0];
    this._updateArrayFromLonLat(result, coords[0], coords[1]);
    return result;
  }

  /**
   * Converts a longitude-latitude-AHL triplet to flat Earth coordinates.
   *
   * @param coords - A longitude-latitude-AHL triplet to convert
   * @returns The converted coordinates
   */
  fromLonLatAhl(coords: [number, number, number]): [number, number, number] {
    const result: [number, number, number] = [0, 0, coords[2]];
    this._updateArrayFromLonLat(result, coords[0], coords[1]);
    return result;
  }

  /**
   * Returns the type of the coordinate system.
   */
  get type(): string {
    return this._type;
  }

  /**
   * Converts a flat Earth coordinate pair to a longitude-latitude pair.
   *
   * @param coords - A flat Earth coordinate pair to convert
   * @returns The converted coordinates
   */
  toLonLat(coords: Coordinate2D): LonLat {
    const result: Coordinate2D = [coords[0], coords[1] * this._yMul];
    Coordinate.rotate(result, this._orientation);
    // NOTE: Type assertions justified by the nature of the calculation
    return [
      (result[1] / this._r2OverCosOriginLatInRadians / this._piOver180 +
        this._origin[0]) as Longitude,
      (result[0] / this._r1 / this._piOver180 + this._origin[1]) as Latitude,
    ];
  }

  /**
   * Converts a flat Earth coordinate triplet to a longitude-latitude-AHL
   * triplet.
   *
   * The Z coordinate of the triplet is copied straight to the AHL value.
   *
   * @param coords - A flat Earth coordinate triplet to convert
   * @returns The converted coordinates
   */
  toLonLatAhl(coords: [number, number, number]): [number, number, number] {
    return [...this.toLonLat([coords[0], coords[1]]), coords[2]];
  }

  /**
   * Updates a THREE.Vector3 object from a longitude-latitude-AHL triplet.
   *
   * This function is designed in a way that it avoids object allocations at
   * all costs.
   *
   * Note that this function also flips the Y axis if needed because Three.js
   * is always right-handed.
   *
   * @param vec - The vector to update
   * @param lon - The longitude
   * @param lat - The latitude
   * @param ahl - The altitude above home level
   */
  updateVector3FromLonLatAhl(
    vec: Vector3,
    lon: number,
    lat: number,
    ahl: number
  ): void {
    this._updateArrayFromLonLat(this._vec, lon, lat);

    vec.x = this._vec[0];
    vec.y = this._type === 'nwu' ? this._vec[1] : -this._vec[1];
    vec.z = ahl;
  }

  /**
   * Precalculates a few cached values that are needed in calculations but
   * that do not depend on the coordinate being transformed.
   */
  _precalculate(): void {
    const originLatInRadians = toRadians(this._origin[1]);
    const radius = this._ellipsoid.semiMajorAxis;
    const eccSq = this._ellipsoid.eccentricitySquared;
    const x = 1 - eccSq * Math.sin(originLatInRadians) ** 2;

    this._piOver180 = Math.PI / 180;
    this._r1 = (radius * (1 - eccSq)) / x ** 1.5;
    this._r2OverCosOriginLatInRadians =
      (radius / Math.sqrt(x)) * Math.cos(originLatInRadians);
    this._yMul = this._type === 'neu' ? 1 : -1;
  }

  /**
   * Helper function that takes an input array of length 2 or 3 and updates the
   * first two components such that they represent the X and Y coordinates
   * corresponding to the given longitude and latitde.
   *
   * @param result - The array to update
   * @param lon - The longitude
   * @param lat - The latitude
   */
  _updateArrayFromLonLat(result: number[], lon: number, lat: number): void {
    result[0] = (lat - this._origin[1]) * this._piOver180 * this._r1;
    result[1] =
      (lon - this._origin[0]) *
      this._piOver180 *
      this._r2OverCosOriginLatInRadians;
    Coordinate.rotate(result, -this._orientation);
    result[1] *= this._yMul;
  }
}

/**
 * Converts a pair of Cartesian coordinates into polar coordinates, assuming
 * that the X axis points towards zero degrees.
 *
 * @param coords - The Cartesian coordinates to convert
 * @returns The polar coordinates, angle being expressed in degrees
 *          between 0 and 360
 */
export function toPolar(coords: [number, number]): [number, number] {
  const dist = Math.hypot(coords[0], coords[1]);
  if (dist > 0) {
    const angle = toDegrees(Math.atan2(coords[1], coords[0]));
    return [dist, angle < 0 ? angle + 360 : angle];
  }

  return [0, 0];
}

/**
 * Buffer a polygon by inserting a padding around it, so its new edge is at
 * least as far from the old one, as given in the margin parameter.
 *
 * TODO: Make `bufferPolygon` simply operate with `LonLat` as input
 *       and output to avoid a bunch of back and forth conversions!
 */
export const bufferPolygon = (
  coordinates: EasNor[],
  margin: number
): Result<EasNor[], string> => {
  const geoCoordinates = coordinates.map(
    unary<EasNor, LonLat>(lonLatFromMapViewCoordinate)
  );

  const geometry = createGeometryFromPoints(geoCoordinates);
  if (geometry.isErr()) {
    return err(geometry.error);
  }

  // NOTE: The types declared for `turfBuffer` seem to be wrong, it can
  //       possibly return `undefined` (and radius isn't optional either)
  const bufferedPoly = turfBuffer(
    geometry.value,
    margin / 1000 /* Turf.js needs kilometers */
  );

  if (!Array.isArray(bufferedPoly?.geometry?.coordinates[0])) {
    return err(
      'a coordinate array is expected as the first linear ring of the polygon'
    );
  }

  const outerLinearRing =
    // NOTE: Type assertion justified by the documentation of `Position` in
    // `TurfHelpers`: "Array should contain between two and three elements."
    (bufferedPoly.geometry.coordinates[0] as LonLat[])?.map(
      unary<LonLat, EasNor>(mapViewCoordinateFromLonLat)
    );

  return ok(outerLinearRing);
};

/**
 * Takes the coordinates (perimeter and holes) of a polygon and normalizes it
 * such that holes don't intersect (they get merged in that case) and all holes
 * are completely contained in the perimeter. Returns an array of polygons,
 * since this operation might split the input into multiple parts.
 *
 * Note: Turf expects polygons to be closed (the first and last coordinates
 *       should be equal), so this function inherits this requirement.
 */
export function normalizePolygon([points, ...holes]: any): any {
  // TODO: This should be typed properly!

  // Start with the boundary ring and subtract every hole from it with Turf
  // TODO: This can be simplified when Turf 7.0.0 gets released, as
  //       difference will support multiple subtrahend features
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const { geometry } = holes.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    (poly: any, hole: any) => turfDifference(poly, TurfHelpers.polygon([hole])),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    TurfHelpers.polygon([points])
  );

  switch (geometry.type) {
    case 'Polygon': {
      return [geometry.coordinates];
    }

    case 'MultiPolygon': {
      return geometry.coordinates;
    }

    default: {
      throw new Error(`Unexpected geometry type: ${geometry.type}`);
    }
  }
}

type ScaledJSONGPSCoordinate = [number, number];

/**
 * Converts a longitude-latitude pair to a representation that is safe to be
 * transferred in JSON over to the server without worrying about floating-point
 * rounding errors.
 *
 * @param  coords  the longitude-latitude pair to convert, represented
 *         as an object with a `lon` and a `lat` key.
 * @return the JSON representation, scaled up to 1e7 degrees. Note
 *         that it returns the <em>latitude</em> first
 */
export const toScaledJSONFromObject = (coords: {
  lat: Latitude;
  lon: Longitude;
}): ScaledJSONGPSCoordinate => [
  Math.round(coords.lat * 1e7),
  Math.round(coords.lon * 1e7),
];

/**
 * Converts a longitude-latitude pair to a representation that is safe to be
 * transferred in JSON over to the server without worrying about floating-point
 * rounding errors.
 *
 * @param  coords  the longitude-latitude pair to convert, represented
 *         as an array in lon-lat order (<em>longitude</em> first, OpenLayers
 *         convention)
 * @return the JSON representation, scaled up to 1e7 degrees. Note
 *         that it returns the <em>latitude</em> first
 */
export const toScaledJSONFromLonLat = (
  coords: LonLat
): ScaledJSONGPSCoordinate => [
  Math.round(coords[1] * 1e7),
  Math.round(coords[0] * 1e7),
];

/**
 * Reverts a "JSON-safe" multiplier offset coordinate representation to a
 * simple decimal longitude-latitude pair
 *
 * @param  coords  the JSON representation, scaled up to 1e7 degrees.
 *         Note that it contains the <em>latitude</em> first
 * @return the resulting longitude-latitude pair, represented
 *         as an array in lon-lat order (<em>longitude</em> first, OpenLayers
 *         convention)
 */
export const toLonLatFromScaledJSON = (
  coords: ScaledJSONGPSCoordinate
): LonLat =>
  // TODO: Eliminate or justify this type assertion
  [(coords[1] / 1e7) as Longitude, (coords[0] / 1e7) as Latitude];

/**
 * Calculates the distance in meters between two GeoJSON point features.
 * (By default `turfDistance` returns kilometers and does not have
 * meters available as an option, only degrees, radians and miles...)
 *
 * @param first   the first point
 * @param second  the second point
 * @return the distance between the two points in meters
 */
export const turfDistanceInMeters = (
  first: TurfHelpers.Coord,
  second: TurfHelpers.Coord
): number => turfDistance(first, second) * 1000;
