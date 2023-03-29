import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import {
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
} from '~/features/mission/selectors';
import { isShowIndoor } from '~/features/show/selectors';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

/**
 * Returns the position and rotation of the camera in the 3D view.
 */
export const getCameraPose = (state) => state.threeD.camera;

/**
 * Returns a function that can be called with a single object having `lon`,
 * `lat` and `ahl` properties and that returns the corresponding coordinate
 * in the coordinate system used by the 3D view.
 */
const getGPSToThreeJSTransformation = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformation) => {
    const flipY = transformation?.type !== 'nwu';
    return (coordinate) => {
      if (isNil(coordinate) || !transformation) {
        return null;
      }

      const result = transformation.fromLonLatAhl([
        coordinate.lon,
        coordinate.lat,
        coordinate.ahl,
      ]);

      if (flipY) {
        // Three.JS is always right-handed but our flat Earth coordinate system
        // might be left-handed, so we have the opportunity to flip the Y axis.
        result[1] = -result[1];
      }

      return result;
    };
  }
);

/**
 * Returns an array containing the home positions of each UAV in the current
 * mission, in the coordinate system used by the 3D view.
 */
export const getHomePositionsInMissionForThreeDView = createSelector(
  getGPSBasedHomePositionsInMission,
  getGPSToThreeJSTransformation,
  (homePositions, transformation) => homePositions.map(transformation)
);

/**
 * Returns an array containing the landing positions of each UAV in the current
 * mission, in the coordinate system used by the 3D view.
 */
export const getLandingPositionsInMissionForThreeDView = createSelector(
  getGPSBasedLandingPositionsInMission,
  getGPSToThreeJSTransformation,
  (landingPositions, transformation) => landingPositions.map(transformation)
);

/**
 * Selector that returns the radius that should be used for the drones in the
 * 3D view.
 */
export const getPreferredDroneRadius = (state) =>
  isShowIndoor(state) ? 0.2 : 0.5;
