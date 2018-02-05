/**
 * @file Geography-related utility functions and variables.
 */

import { curry, minBy } from 'lodash'
import Coordinate from 'ol/coordinate'
import GeometryCollection from 'ol/geom/geometrycollection'
import MultiLineString from 'ol/geom/multilinestring'
import MultiPolygon from 'ol/geom/multipolygon'
import Projection from 'ol/proj'
import Sphere from 'ol/sphere'

/**
 * Calculates the Euclidean distance between two OpenLayers coordinates.
 * Also works for higher dimensions.
 *
 * @param {number[]|ol.Coordinate} first   the first coordinate
 * @param {number[]|ol.Coordinate} second  the second coordinate
 * @return {number} the Euclidean distance between the two coordinates
 */
export const euclideanDistance = (first, second) => {
  const n = Math.min(first.length, second.length)
  let sum = 0.0
  for (let i = 0; i < n; i++) {
    sum += Math.pow(first[i] - second[i], 2)
  }
  return Math.sqrt(sum)
}

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
  return findFeaturesById(map, [featureId])[0]
})

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
  const features = []
  features.length = featureIds.length

  map.getLayers().forEach(layer => {
    if (!layer.getVisible()) {
      return
    }

    const source = layer.getSource ? layer.getSource() : undefined
    if (source && source.getFeatureById) {
      const n = features.length
      for (let i = 0; i < n; i++) {
        if (features[i] === undefined) {
          const feature = source.getFeatureById(featureIds[i])
          if (feature !== undefined) {
            features[i] = feature
          }
        }
      }
    }
  })

  return features
})

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
    return coordinate
  }

  // For geometry collections, recurse into the sub-geometries and return
  // the closest point of the closest geometry.
  // For multi-linestrings, recurse into the sub-linestrings and return
  // the closest point of the closest linestring
  // For multi-polygons, recurse into the sub-polygons and return
  // the closest point of the closest polygon.
  let subGeometries
  if (geometry instanceof GeometryCollection) {
    subGeometries = geometry.getGeometries()
  } else if (geometry instanceof MultiPolygon) {
    subGeometries = geometry.getPolygons()
  } else if (geometry instanceof MultiLineString) {
    subGeometries = geometry.getLineStrings()
  }
  if (subGeometries !== undefined) {
    const closestPoints = subGeometries.map(
      subGeometry => getExactClosestPointOf(subGeometry, coordinate)
    )
    return minBy(closestPoints, euclideanDistance.bind(null, coordinate))
  }

  // For anything else, just fall back to getClosestPoint()
  return geometry.getClosestPoint(coordinate)
}

/**
 * Creates a function that formats an OpenLayers coordinate into the
 * usual latitude-longitude representation with the given number of
 * fractional digits.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 *
 * @param {number} digits  the number of fractional digits to show
 * @return {function} the constructed function
 */
export const makeCoordinateFormatter = (digits = 6) => {
  return coordinate => (
    Coordinate.format(coordinate, '{y}, {x}', digits)
  )
}

export const translateBy = curry((displacement, coordinates) => {
  const dx = displacement[0]
  const dy = displacement[1]
  if (dx === 0 && dy === 0) {
    return coordinates
  } else {
    return coordinates.map(coordinate => [coordinate[0] + dx, coordinate[1] + dy])
  }
})

/**
 * Formats the given OpenLayers coordinate into the usual latitude-longitude
 * representation in a format suitable for the UI.
 *
 * The constructed function accepts either a single OpenLayers coordinate
 * or a longitude-latitude pair as an array of two numbers.
 */
export const formatCoordinate = makeCoordinateFormatter()

/**
 * An OpenLayers sphere whose radius is equal to the semi-major axis of the
 * WGS84 ellipsoid, in metres. Useful for calculating distances on the Earth
 * (also in metres).
 */
export const wgs84Sphere = new Sphere(6378137)

/**
 * The defaul value for projection is "EPSG:3857", a Spherical Mercator
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
export const coordinateFromLonLat = Projection.fromLonLat

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
export const lonLatFromCoordinate = Projection.toLonLat
