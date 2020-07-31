/**
 * @file Functions and constants related to the different types of features
 * that we use on the map.
 */

import isNil from 'lodash-es/isNil';
import unary from 'lodash-es/unary';
import LocationOn from '@material-ui/icons/LocationOn';
import ShowChart from '@material-ui/icons/ShowChart';
import CropSquare from '@material-ui/icons/CropSquare';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import StarBorder from '@material-ui/icons/StarBorder';
import React from 'react';

import { lonLatFromMapViewCoordinate } from '../utils/geography';

/**
 * Enum containing constants for the various feature types that we support.
 */
export const FeatureType = {
  CIRCLE: 'circle',
  LINE_STRING: 'lineString',
  POINTS: 'points',
  POLYGON: 'polygon',
  RECTANGLE: 'rectangle',
};

/**
 * Enum constants for the various label types that we support.
 */
export const LabelStyle = {
  HIDDEN: 'hidden',
  NORMAL: 'normal',
  THICK_OUTLINE: 'thickOutline',
  THIN_OUTLINE: 'thinOutline',
};

/**
 * Converts an OpenLayers feature object into a corresponding feature object
 * that can be stored in the global state store.
 *
 * @param  {ol.Feature} olFeature  the OpenLayers feature
 * @return {Object}  the feature to store in the global state
 */
export function createFeatureFromOpenLayers(olFeature) {
  const result = {};
  const geometry = olFeature.getGeometry();
  const type = geometry.getType();
  const coordinates = geometry.getCoordinates();

  switch (type) {
    case 'Point':
      Object.assign(result, {
        type: FeatureType.POINTS,
        filled: false,
        points: [lonLatFromMapViewCoordinate(coordinates)],
      });
      break;

    case 'Circle': {
      const center = geometry.getCenter();
      Object.assign(result, {
        type: FeatureType.CIRCLE,
        filled: true,
        points: [
          lonLatFromMapViewCoordinate(center),
          lonLatFromMapViewCoordinate([
            center[0] + geometry.getRadius(),
            center[1],
          ]),
        ],
      });
      break;
    }

    case 'LineString':
      Object.assign(result, {
        type: FeatureType.LINE_STRING,
        filled: false,
        points: coordinates.map(unary(lonLatFromMapViewCoordinate)),
      });
      break;

    case 'Polygon':
      if (coordinates.length !== 1) {
        throw new Error('Polygon geometry should not have any holes');
      }

      Object.assign(result, {
        type: FeatureType.POLYGON,
        filled: true,
        points: coordinates[0]
          .map(unary(lonLatFromMapViewCoordinate))
          .slice(0, -1),
      });
      break;

    default:
      throw new Error('Unsupported feature geometry type: ' + type);
  }

  return result;
}

const _featureTypeIcons = {
  [FeatureType.CIRCLE]: React.createElement(PanoramaFishEye),
  [FeatureType.LINE_STRING]: React.createElement(ShowChart),
  [FeatureType.POINTS]: React.createElement(LocationOn),
  [FeatureType.POLYGON]: React.createElement(StarBorder),
  [FeatureType.RECTANGLE]: React.createElement(CropSquare),
};

const _featureTypeNames = {
  [FeatureType.CIRCLE]: 'Circle',
  [FeatureType.LINE_STRING]: 'Path',
  [FeatureType.POINTS]: 'Marker',
  [FeatureType.POLYGON]: 'Polygon',
  [FeatureType.RECTANGLE]: 'Rectangle',
};

/**
 * Returns the human-readable name of the given feature type.
 *
 * @param  {string}  type  the feature type
 * @return {string} the human-readable name of the feature type, in lowercase
 */
export function getNameOfFeatureType(type) {
  return _featureTypeNames[type] || 'Feature';
}

/**
 * Returns an icon corresponding to the given feature type.
 *
 * @param  {string}  type  the feature type
 * @return {JSX.Element}  an icon representing the feature type on the UI
 */
export function getIconOfFeatureType(type) {
  return _featureTypeIcons[type] || _featureTypeIcons[FeatureType.POINTS];
}

/**
 * Returns whether the given OpenLayers feature is transformable with a
 * standard transformation interaction.
 *
 * @param  {ol.Feature|null|undefined}  feature  the feature to test
 * @return {boolean} whether the feature is transformable
 */
export function isFeatureTransformable(feature) {
  if (isNil(feature)) {
    return false;
  }

  const parts = feature.getId().split('$');
  if (parts.length < 2) {
    return false;
  }

  switch (parts[0]) {
    case 'feature':
    case 'home':
      return true;

    default:
      return false;
  }
}
