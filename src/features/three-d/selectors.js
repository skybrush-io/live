import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import {
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
} from '~/features/mission/selectors';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

/**
 * Returns the position and rotation of the camera in the 3D view.
 */
export const getCameraPose = (state) => state.threeD.camera;

/**
 * Returns a function that can be called with a single object having `lon`,
 * `lat` and `agl` properties and that returns the corresponding coordinate
 * in the coordinate system used by the 3D view.
 */
export const getGPSToWorldTransformation = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformation) => (coordinate) => {
    if (isNil(coordinate)) {
      return null;
    }

    return transformation.fromLonLatAgl([
      coordinate.lon,
      coordinate.lat,
      coordinate.agl,
    ]);
  }
);

/**
 * Returns an array containing the home positions of each UAV in the current
 * mission, in the coordinate system used by the 3D view.
 */
export const getFlatEarthHomePositionsInMission = createSelector(
  getGPSBasedHomePositionsInMission,
  getGPSToWorldTransformation,
  (homePositions, transformation) => homePositions.map(transformation)
);

/**
 * Returns an array containing the landing positions of each UAV in the current
 * mission, in the coordinate system used by the 3D view.
 */
export const getFlatEarthLandingPositionsInMission = createSelector(
  getGPSBasedLandingPositionsInMission,
  getGPSToWorldTransformation,
  (homePositions, transformation) => homePositions.map(transformation)
);
