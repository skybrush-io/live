import { createSelector } from '@reduxjs/toolkit';

import {
  getDroneSwarmSpecification,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  isShowIndoor,
} from '~/features/show/selectors';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

import {
  convertTrajectoryToPlaybackPath,
  makeShowLocalCoordinateTransformer,
} from './utils/threeDViewUtils';

export const buildDroneConfigFromShowSpec = ({
  flatEarthCoordinateTransformer,
  indoor,
  showToWorldCoordinate,
  swarm,
}) => {
  if (!Array.isArray(swarm) || !swarm.length) return null;

  const transformCoordinate = makeShowLocalCoordinateTransformer();

  const drones = swarm
    .map((drone, index) => {
      const trajectory = drone?.settings?.trajectory ?? drone?.trajectory;
      const yawControl = drone?.settings?.yawControl ?? drone?.yawControl;
      const converted = convertTrajectoryToPlaybackPath(
        trajectory,
        transformCoordinate,
        drone?.settings?.home ?? drone?.home,
        yawControl
      );
      if (!converted) return null;

      let { initialPos, path } = converted;
      if (Array.isArray(path) && path.length > 0) {
        const p0 = path[0];
        const fx = Number(p0.x);
        const fy = Number(p0.y);
        const fz = Number(p0.z);
        if (Number.isFinite(fx) && Number.isFinite(fy) && Number.isFinite(fz)) {
          initialPos = [fx, fy, fz];
        }
      }

      const id =
        drone?.id !== undefined && drone?.id !== null && String(drone.id).trim() !== ''
          ? String(drone.id)
          : `show-drone-${index + 1}`;
      return {
        id,
        name: drone?.name || `Show drone ${index + 1}`,
        battery: 100,
        status: 'Show',
        pos: initialPos,
        initialPos,
        path,
        yaw: Array.isArray(path) && path.length > 0 && Number.isFinite(Number(path[0].yaw))
          ? Number(path[0].yaw)
          : 0,
      };
    })
    .filter(Boolean);

  return drones.length ? { drones, source: 'showSpec' } : null;
};

export const getShowSpecDroneConfigForThreeDView = createSelector(
  getFlatEarthCoordinateTransformer,
  isShowIndoor,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  getDroneSwarmSpecification,
  (
    flatEarthCoordinateTransformer,
    indoor,
    showToWorldCoordinate,
    swarm
  ) =>
    buildDroneConfigFromShowSpec({
      flatEarthCoordinateTransformer,
      indoor,
      showToWorldCoordinate,
      swarm,
    })
);
