/**
 * @file Functions and constants related to the different types of features
 * that we use on the map.
 */

import LocationOn from '@material-ui/icons/LocationOn';
import ShowChart from '@material-ui/icons/ShowChart';
import CropSquare from '@material-ui/icons/CropSquare';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import StarBorder from '@material-ui/icons/StarBorder';
import React from 'react';

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
 * Returns whether the feature has individual points that are worth showing
 * to the user separately.
 */
export function featureTypeHasPoints(type) {
  return (
    type === FeatureType.LINE_STRING ||
    type === FeatureType.POLYGON ||
    type === FeatureType.RECTANGLE
  );
}

/**
 * Returns whether the feature has an interior area that can be filled on the
 * UI if needed.
 */
export function featureTypeHasInterior(type) {
  return (
    type === FeatureType.CIRCLE ||
    type === FeatureType.POLYGON ||
    type === FeatureType.RECTANGLE
  );
}
