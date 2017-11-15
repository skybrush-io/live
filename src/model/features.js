/**
 * @file Functions and constants related to the different types of features
 * that we use on the map.
 */

/**
 * Converts an OpenLayers feature object into a corresponding feature object
 * that can be stored in the global state store.
 *
 * @param  {ol.Feature} olFeature  the OpenLayers feature
 * @return {Object}  the feature to store in the global state
 */
export function createFeatureFromOpenLayers (olFeature) {
  return {}
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
