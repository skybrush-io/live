import { getClockById } from '~/features/clocks/selectors';
import { CommonClockId } from '~/features/clocks/types';
import { getTickCountOnClockAt } from '~/features/clocks/utils';
import { getReverseMissionMapping } from '~/features/mission/selectors';
import { getRoundedClockSkewInMilliseconds } from '~/features/servers/selectors';

import { getShowSpecDroneConfigForThreeDView } from './showSpecDroneConfig';
import { buildSeekPathWithInitial, slicePathByElapsedMs } from './utils/threeDViewUtils';

const getShowElapsedMs = (state) => {
  const showClock = getClockById(state, CommonClockId.SHOW);
  if (!showClock?.running) return null;

  const clockSkew = getRoundedClockSkewInMilliseconds(state) || 0;
  const ticks = getTickCountOnClockAt(showClock, Date.now() + clockSkew);
  const ticksPerSecond = Number(showClock.ticksPerSecond) || 1;
  return (ticks / ticksPerSecond) * 1000;
};

/**
 * Resolves yaw (degrees) for a live UAV from loaded show spec, if available.
 * Uses show-clock elapsed time while the show is running, otherwise path[0].yaw.
 */
export const resolveShowYawForUav = (state, uavId) => {
  const missionIndex = getReverseMissionMapping(state)?.[uavId];
  if (missionIndex === undefined || missionIndex === null) return null;

  const specConfig = getShowSpecDroneConfigForThreeDView(state);
  const specDrone = specConfig?.drones?.[missionIndex];
  if (!specDrone) return null;

  const seekPath = buildSeekPathWithInitial(specDrone);
  if (!seekPath.length) return null;

  const elapsedMs = getShowElapsedMs(state);
  const point =
    elapsedMs == null
      ? seekPath[0]
      : slicePathByElapsedMs(seekPath, elapsedMs)[0];
  if (!point) return null;

  const yaw = Number(point.yaw);
  return Number.isFinite(yaw) ? yaw : null;
};
