import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import {
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission
} from '~/features/mission/selectors';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

const convertCoordinates = (homePositions, transformation) =>
  homePositions.map(homePosition => {
    if (isNil(homePosition)) {
      return null;
    }

    return transformation.fromLonLatAgl([
      homePosition.lon,
      homePosition.lat,
      homePosition.agl
    ]);
  });

/**
 * Returns an array containing the home positions of each UAV in the current
 * mission, in the coordinate system used by the 3D view.
 */
export const getFlatEarthHomePositionsInMission = createSelector(
  getGPSBasedHomePositionsInMission,
  getFlatEarthCoordinateTransformer,
  convertCoordinates
);

/**
 * Returns an array containing the landing positions of each UAV in the current
 * mission, in the coordinate system used by the 3D view.
 */
export const getFlatEarthLandingPositionsInMission = createSelector(
  getGPSBasedLandingPositionsInMission,
  getFlatEarthCoordinateTransformer,
  convertCoordinates
);
