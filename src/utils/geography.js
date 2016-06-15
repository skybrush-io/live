/**
 * @file Geography-related utility functions and variables.
 */

import ol from 'openlayers'

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
 * An OpenLayers sphere whose radius is equal to the semi-major axis of the
 * WGS84 ellipsoid, in metres. Useful for calculating distances on the Earth
 * (also in metres).
 */
export const wgs84Sphere = new ol.Sphere(6378137)
