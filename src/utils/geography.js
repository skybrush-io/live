/**
 * @file Geography-related utility functions and variables.
 */

import CoordinateParser from 'coordinate-parser';
import formatCoords from 'formatcoords';
import curry from 'lodash-es/curry';
import isNil from 'lodash-es/isNil';
import minBy from 'lodash-es/minBy';
import * as Coordinate from 'ol/coordinate';
import * as Extent from 'ol/extent';
import { MultiLineString, MultiPolygon, Polygon } from 'ol/geom';
import GeometryCollection from 'ol/geom/GeometryCollection';
import * as Projection from 'ol/proj';

import { toDegrees, toRadians } from '~/utils/math';

/**
 * Returns the (initial) bearing when going from one point to another on a
 * sphere along a great circle.
 *
 * The spherical coordinates must be specified in degrees, in longitude-latitude
 * order.
 *
 * @param  {number[]}  first   the first point
 * @param  {number[]}  second  the second point
 * @return the bearing, in degrees, in the [0; 360) range.
 */
export function bearing(first, second) {
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
 * Returns the final earing when going from one point to another on a
 * sphere along a great circle.
 *
 * The spherical coordinates must be specified in degrees, in longitude-latitude
 * order.
 *
 * @param  {number[]}  first   the first point
 * @param  {number[]}  second  the second point
 * @return the bearing, in degrees, in the [0; 360) range.
 */
export function finalBearing(first, second) {
  const angle = bearing(second, first);
  return (angle + 180) % 360;
}

/**
 * Creates an OpenLayers geometry function used by the "draw" interaction
 * to draw a box whose sides are parallel to axes obtained by rotating the
 * principal axes with the given angle.
 *
 * @param  {number|function(): number}  angle  the rotation angle of the axes or
 *         a function that returns the angle when invoked
 * @return {ol.DrawGeometryFunctionType}  the geometry function
 */
export const createRotatedBoxGeometryFunction = (angle) => (
  coordinates,
  optGeometry
) => {
  if (coordinates.length !== 2) {
    throw new Error('must be called with two points only');
  }

  // Get the effective angle
  const effectiveAngle = typeof angle === 'number' ? angle : angle();

  // Translate the rectangle spanned by the two coordinates
  // such that its center is at the origin, then undo the rotation
  // of the map
  const [a, b] = coordinates;
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
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
 * Calculates the Euclidean distance between two OpenLayers coordinates.
 * Also works for higher dimensions.
 *
 * @param {number[]|ol.Coordinate} first   the first coordinate
 * @param {number[]|ol.Coordinate} second  the second coordinate
 * @return {number} the Euclidean distance between the two coordinates
 */
export const euclideanDistance = (first, second) => {
  const n = Math.min(first.length, second.length);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (first[i] - second[i]) ** 2;
  }

  return Math.sqrt(sum);
};

/**
 * Finds a single feature with a given global ID on all layers of an
 * OpenLayers map.
 *
 * @param {ol.Map}  map  the OpenLayers map
 * @param {string}  featureId  the ID of the feature to look for
 * @return {ol.Feature}  the OpenLayers feature or undefined if there is
 *         no such feature on any of the visible layers
 */
export const findFeatureById = curry((map, featureId) => {
  return findFeaturesById(map, [featureId])[0];
});

/**
 * Finds the features corresponding to an array of feature IDs on the given
 * OpenLayers map.
 *
 * @param {ol.Map}    map  the OpenLayers map
 * @param {string[]}  featureIds  the global IDs of the features
 * @return {ol.Feature[]}  an array of OpenLayers features corresponding to
 *         the given feature IDs; the array might contain undefined entries
 *         for features that are not found on the map
 */
export const findFeaturesById = curry((map, featureIds) => {
  const features = [];
  features.length = featureIds.length;

  for (const layer of map.getLayers().getArray()) {
    const source =
      layer.getVisible() && layer.getSource ? layer.getSource() : undefined;
    if (!source) {
      continue;
    }

    const n = features.length;
    for (let i = 0; i < n; i++) {
      if (!features[i]) {
        const feature = source.getFeatureById
          ? source.getFeatureById(featureIds[i])
          : undefined;
        if (feature) {
          features[i] = feature;
        }
      }
    }
  }

  return features;
});

/**
 * Returns the closest point of a geometry from the given OpenLayers
 * coordinates.
 *
 * Note that this function is different from `ol.geom.Geometry.getClosestPoint()`:
 * when the coordinate is contained in the given geometry, it will return the
 * coordinate itself instead of finding the closest point on the boundary.
 *
 * @param {ol.geom.Geometry}       geometry    the geometry
 * @param {number[]|ol.Coordinate} coordinate  the point to consider
 * @return {number[]} the coordinates of the closest point of the given
 *      geometry
 */
export const getExactClosestPointOf = (geometry, coordinate) => {
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
    return minBy(closestPoints, euclideanDistance.bind(null, coordinate));
  }

  // For anything else, just fall back to getClosestPoint()
  return geometry.getClosestPoint(coordinate);
};

/**
 * Creates a function that formats an OpenLayers coordinate into the
 * usual decimal latitude-longitude representation with the given number
 * of fractional digits.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 *
 * @param {Object}  options  formatting options
 * @param {number}  options.digits  the number of fractional digits to show
 * @param {boolean} options.reverse  whether to reverse the X and Y coordinates
 * @param {string}  options.separator  separator between the X and Y coordinates
 * @param {string}  options.unit   the unit to show after the digits
 * @return {function} the constructed function
 */
export const makeDecimalCoordinateFormatter = ({
  digits,
  reverse,
  separator = ', ',
  unit,
}) => {
  const formatString = reverse
    ? unit
      ? '{y}' + unit + separator + '{x}' + unit
      : '{y}' + separator + '{x}'
    : unit
    ? '{x}' + unit + separator + '{y}' + unit
    : '{x}' + separator + '{y}';
  return (coordinate) => Coordinate.format(coordinate, formatString, digits);
};

/**
 * Creates a function that formats an OpenLayers polar coordinate pair into
 * a nice human-readable representation with the given number of fractional
 * digits.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 *
 * @param {Object}  options  formatting options
 * @param {number}  options.digits  the number of fractional digits to show
 * @param {string}  options.unit   the unit to show after the digits
 * @return {function} the constructed function
 */
export const makePolarCoordinateFormatter = (options) => {
  const { digits, unit } = options;
  return unit
    ? (coordinate) =>
        Coordinate.format(
          coordinate,
          '{x}' + unit + ' \u2220 {y}\u00B0',
          digits
        )
    : (coordinate) =>
        Coordinate.format(coordinate, '{x} \u2220 {y}\u00B0', digits);
};

/**
 * Creates a function that formats an OpenLayers coordinate into the
 * sexagesimal latitude-longitude representation.
 *
 * @param {number} decimalPlaces  the number of decimal places to show
 * @return {function} the constructed function
 */
export const makeSexagesimalCoordinateFormatter = (decimalPlaces = 3) => (
  coordinate
) => formatCoords(coordinate, true).format('FFf', { decimalPlaces });

/**
 * Merges an array of OpenLayer extents and returns a single extent that contains
 * all of them.
 *
 * @param  {ol.Extent[]} extents  the extents to merge
 * @return {ol.Extent} the merged OpenLayers extent
 */
export function mergeExtents(extents) {
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
 * @param  {number|string} angle  the input angle
 * @return {string}  the normalized angle as a string to avoid rounding errors
 */
export const normalizeAngle = (angle) =>
  (((angle % 360) + 360) % 360).toFixed(1);

export const translateBy = curry((displacement, coordinates) => {
  const dx = displacement[0];
  const dy = displacement[1];
  if (dx === 0 && dy === 0) {
    return coordinates;
  }

  return coordinates.map((coordinate) => [
    coordinate[0] + dx,
    coordinate[1] + dy,
  ]);
});

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
  unit: '\u00B0',
});

export const safelyFormatCoordinate = (coordinate) => {
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
 * @param  {string} text  the text to parse
 * @return {number[]|undefined}  the parsed coordinates in OpenLayers format
 *         or undefined in case of a parsing error
 */
export const parseCoordinate = (text) => {
  try {
    const parsed = new CoordinateParser(text);
    return [parsed.getLongitude(), parsed.getLatitude()];
  } catch {
    return undefined;
  }
};

/**
 * Function that creates an object holding the standard properties of an
 * ellipsoid model from the length of the semi-major axis and the inverse
 * flattening.
 *
 * @param {number} semiMajorAxis  the length of the semi-major axis
 * @param {number} inverseFlattening  the inverse flattening of the ellipsoid;
 *        use Number.POSITIVE_INFINITY for perfect spheres
 * @return {Object} an object holding the standard properties of the given
 *         ellipsoid
 */
const makeEllipsoidModel = (semiMajorAxis, inverseFlattening) => {
  const result = {
    inverseFlattening,
    semiMajorAxis,
    flattening: 1 / inverseFlattening,
  };
  result.eccentricitySquared = result.flattening * (2 - result.flattening);
  result.eccentricity = Math.sqrt(result.eccentricitySquared);
  result.semiMinorAxis = result.semiMajorAxis * (1 - result.flattening);
  result.meanRadius = (result.semiMinorAxis + result.semiMajorAxis * 2) / 3;
  return Object.freeze(result);
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
 * @param {number[]} coords the longitude and latitude, in this order
 * @param {ol.ProjectionLike} projection the projection to use for the conversion
 * @return {Object} the OpenLayers coordinates corresponding to the given
 * longitude-latitude pair
 */
export const mapViewCoordinateFromLonLat = Projection.fromLonLat;

/**
 * Helper function to convert a coordinate from the map view into a
 * longitude-latitude pair.
 *
 * Coordinates are assumed to be given in EPSG:3857.
 *
 * @param {number[]} coords the OpenLayers coordinates
 * @param {ol.ProjectionLike} projection the projection to use for the conversion
 * @return {Object} the longtitude-latitude pair corresponding to the given
 * OpenLayers coordinates
 */
export const lonLatFromMapViewCoordinate = Projection.toLonLat;

/**
 * Class that defines a flat-Earth coordinate system centered at a given
 * spherical coordinate.
 */
export class FlatEarthCoordinateSystem {
  /**
   * Constructor.
   *
   * @param {number[]} origin the longitude-latitude pair that defines the
   *        origin of the coordinate system
   * @param {number} orientation the orientation of the zero-degree axis of the
   *        coordinate system, in degrees, zero being north, 90 degrees
   *        being east, 180 degrees being south and 270 degrees being west.
   * @param {string} type type of the axis configuration of the flat Earth
   *        coordinate system: `neu` means that the coordinate system is
   *        left-handed (north-east-up) `nwu` means that the coordinate system
   *        is right-handed (north-west-up)
   * @param {Object} ellipsoid  the model of the ellipsoid on which the
   *        coordinate system is defined; defaults to WGS84
   */
  constructor({ origin, orientation = 0, type = 'neu', ellipsoid = WGS84 }) {
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
   * @param {number[]} coords  a longitude-latitude pair to convert
   * @return {number[]} the converted coordinates
   */
  fromLonLat(coords) {
    const result = [0, 0];
    return this._updateArrayFromLonLat(result, coords[0], coords[1]);
  }

  /**
   * Converts a longitude-latitude-AGL triplet to flat Earth coordinates.
   *
   * @param {number[]} coords  a longitude-latitude-AGL triplet to convert
   * @return {number[]} the converted coordinates
   */
  fromLonLatAgl(coords) {
    const result = [0, 0, coords[2]];
    return this._updateArrayFromLonLat(result, coords[0], coords[1]);
  }

  /**
   * Returns the type of the coordinate system.
   */
  get type() {
    return this._type;
  }

  /**
   * Converts a flat Earth coordinate pair to a longitude-latitude pair.
   *
   * @param {number[]} coords  a flat Earth coordinate pair to convert
   * @return {number[]} the converted coordinates
   */
  toLonLat(coords) {
    const result = [coords[0], coords[1] * this._yMul];
    Coordinate.rotate(result, this._orientation);
    return [
      result[1] / this._r2OverCosOriginLatInRadians / this._piOver180 +
        this._origin[0],
      result[0] / this._r1 / this._piOver180 + this._origin[1],
    ];
  }

  /**
   * Converts a flat Earth coordinate triplet to a longitude-latitude-AGL
   * triplet.
   *
   * The Z coordinate of the triplet is copied straight to the AGL value.
   *
   * @param {number[]} coords  a flat Earth coordinate triplet to convert
   * @return {number[]} the converted coordinates
   */
  toLonLatAgl(coords) {
    return [...this.toLonLat(coords), coords[2]];
  }

  /**
   * Updates a THREE.Vector3 object from a longitude-latitude-AGL triplet.
   *
   * This function is designed in a way that it avoids object allocations at
   * all costs.
   *
   * Note that this function also flips the Y axis if needed because Three.js
   * is always right-handed.
   *
   * @param {THREE.Vector3}  vec  the vector to update
   * @param {number}  lon  the longitude
   * @param {number}  lat  the latitude
   * @param {number}  agl  the altitude above ground level
   */
  updateVector3FromLonLatAgl(vec, lon, lat, agl) {
    this._updateArrayFromLonLat(this._vec, lon, lat);

    vec.x = this._vec[0];
    vec.y = this._type === 'nwu' ? this._vec[1] : -this._vec[1];
    vec.z = agl;
  }

  /**
   * Precalculates a few cached values that are needed in calculations but
   * that do not depend on the coordinate being transformed.
   */
  _precalculate() {
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
   * Hlper function that takes an input array of length 2 or 3 and updates the
   * first two components such that they represent the X and Y coordinates
   * corresponding to the given longitude and latitde.
   *
   * @param  {number[]} result  the array to update
   * @param  {number}   lon     the longitude
   * @param  {number}   lat     the latitude
   */
  _updateArrayFromLonLat(result, lon, lat) {
    result[0] = (lat - this._origin[1]) * this._piOver180 * this._r1;
    result[1] =
      (lon - this._origin[0]) *
      this._piOver180 *
      this._r2OverCosOriginLatInRadians;
    Coordinate.rotate(result, -this._orientation);
    result[1] *= this._yMul;
    return result;
  }
}

/**
 * Converts a pair of Cartesian coordinates into polar coordinates, assuming
 * that the X axis points towards zero degrees.
 *
 * @param {number[]} coords  the Cartesian coordinates to convert
 * @return {number[]} the polar coordinates, angle being expressed in degrees
 *         between 0 and 360
 */
export function toPolar(coords) {
  const dist = Math.sqrt(coords[0] * coords[0] + coords[1] * coords[1]);
  if (dist > 0) {
    const angle = toDegrees(Math.atan2(coords[1], coords[0]));
    return [dist, angle < 0 ? angle + 360 : angle];
  }

  return [0, 0];
}
