/**
 * @file Selectors that return formatter functions for various types of
 * objects on the user interface.
 */

import { createSelector } from 'reselect'

import {
  FlatEarthCoordinateSystem,
  formatCoordinate,
  makeDecimalCoordinateFormatter,
  makePolarCoordinateFormatter,
  toPolar
} from '../utils/geography'

/**
 * Selector that returns a conversion object that can be used to transform
 * longitude-latitude pairs to/from flat Earth coordinates according to the
 * current parameters set in the state object.
 */
export const getFlatEarthCoordinateTransformer = createSelector(
  state => state.map.origin,
  origin => (
    origin.position
      ? new FlatEarthCoordinateSystem(origin.position, origin.angle, origin.type)
      : undefined
  )
)

const cartesianFormatter = makeDecimalCoordinateFormatter(2, ' m')
const polarFormatter = makePolarCoordinateFormatter(2, ' m')

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system.
 */
export const getFlatEarthCartesianCoordinateFormatter = createSelector(
  getFlatEarthCoordinateTransformer,
  transformer => {
    if (transformer !== undefined) {
      return coords => cartesianFormatter(transformer.fromLonLat(coords))
    } else {
      return undefined
    }
  }
)

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system.
 */
export const getFlatEarthPolarCoordinateFormatter = createSelector(
  getFlatEarthCoordinateTransformer,
  transformer => {
    if (transformer !== undefined) {
      return coords => polarFormatter(toPolar(transformer.fromLonLat(coords)))
    } else {
      return undefined
    }
  }
)

/**
 * Selector that returns a function that can be called with longitude-latitude
 * pairs and that returns a nicely formatted representation of the corresponding
 * flat Earth coordinates according to the current flat Earth coordinate system,
 * both in Cartesian (X-Y) and polar coordinates.
 */
export const getFlatEarthCombinedCoordinateFormatter = createSelector(
  getFlatEarthCoordinateTransformer,
  transformer => {
    if (transformer !== undefined) {
      return coords => {
        const transformed = transformer.fromLonLat(coords)
        return cartesianFormatter(transformed) + '<br/>' +
          polarFormatter(toPolar(transformed))
      }
    } else {
      return undefined
    }
  }
)

/**
 * Selector that returns a coordinate formatter that can be used in contexts
 * where we want to show both the geographical coordinates and the coordinates
 * relative to the origin of the flat Earth coordinate system.
 */
export const getExtendedCoordinateFormatter = createSelector(
  getFlatEarthCombinedCoordinateFormatter,
  formatter => coords => {
    if (formatter === undefined) {
      return formatCoordinate(coords)
    } else {
      return formatCoordinate(coords) + '<br/>' + formatter(coords)
    }
  }
)
