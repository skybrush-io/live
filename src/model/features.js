/**
 * @file Functions and constants related to the different types of features
 * that we use on the map.
 */

import { dropRight, unary } from 'lodash'
import { lonLatFromCoordinate } from '../utils/geography'

/**
 * Enum containing constants for the various feature types that we support.
 */
export const FeatureType = {
  CIRCLE: 'circle',
  LINE_STRING: 'lineString',
  POINTS: 'points',
  POLYGON: 'polygon'
}

/**
 * Converts an OpenLayers feature object into a corresponding feature object
 * that can be stored in the global state store.
 *
 * @param  {ol.Feature} olFeature  the OpenLayers feature
 * @return {Object}  the feature to store in the global state
 */
export function createFeatureFromOpenLayers (olFeature) {
  const result = {}
  const geometry = olFeature.getGeometry()
  const type = geometry.getType()
  const coordinates = geometry.getCoordinates()

  switch (type) {
    case 'Point':
      Object.assign(result, {
        type: FeatureType.POINTS,
        points: [lonLatFromCoordinate(coordinates)]
      })
      break

    case 'Circle':
      const center = geometry.getCenter()
      Object.assign(result, {
        type: FeatureType.CIRCLE,
        points: [
          lonLatFromCoordinate(center),
          lonLatFromCoordinate([center[0] + geometry.getRadius(), center[1]])
        ]
      })
      break

    case 'LineString':
      Object.assign(result, {
        type: FeatureType.LINE_STRING,
        points: coordinates.map(unary(lonLatFromCoordinate))
      })
      break

    case 'Polygon':
      if (coordinates.length !== 1) {
        throw new Error('Expected polygon geometry not to have any holes')
      }
      Object.assign(result, {
        type: FeatureType.POLYGON,
        points: dropRight(coordinates[0].map(unary(lonLatFromCoordinate)))
      })
      break

    default:
      throw new Error('Unsupported feature geometry type: ' + type)
  }

  return result
}

const _featureTypeNames = {
  'circle': 'Circle',
  'lineString': 'Path',
  'points': 'Marker',
  'polygon': 'Polygon'
}

/**
 * Returns the human-readable name of the given feature type.
 *
 * @param  {string}  type  the feature type
 * @return {string} the human-readable name of the feature type, in lowercase
 */
export function getNameOfFeatureType (type) {
  return _featureTypeNames[type] || 'Feature'
}
