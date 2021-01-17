import groupBy from 'lodash-es/groupBy';
import isNil from 'lodash-es/isNil';
import sortBy from 'lodash-es/sortBy';
import { getDistance as haversineDistance } from 'ol/sphere';
import createCachedSelector from 're-reselect';

import { createSelector } from '@reduxjs/toolkit';

import {
  getGPSBasedHomePositionsInMission,
  getMissionMapping,
  getReverseMissionMapping,
  getUAVIdsParticipatingInMission,
  getTakeoffHeadingsInMission,
} from '~/features/mission/selectors';
import {
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
} from '~/features/settings/selectors';
import {
  getFirstPointsOfTrajectories,
  getShowToFlatEarthCoordinateSystemTransformation,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  getTrajectories,
  isShowIndoor,
} from '~/features/show/selectors';
import {
  getPointsOfTrajectory,
  isValidTrajectory,
} from '~/features/show/trajectory';
import {
  abbreviateError,
  errorSeverityToSemantics,
  getSeverityOfErrorCode,
  getSeverityOfMostSevereErrorCode,
  ErrorCode,
  Severity,
} from '~/flockwave/errors';
import { convertRGB565ToCSSNotation } from '~/flockwave/parsing';
import { UAVAge } from '~/model/uav';
import { euclideanDistance2D } from '~/utils/math';

/**
 * Returns the list of UAV IDs that should be shown on the UI, in the
 * order preferred by the state of the application.
 *
 * @param  {Object}  state  the state of the application
 */
export const getUAVIdList = (state) => state.uavs.order;

/**
 * Key selector function for cached selectors that cache things by UAV ID.
 */
const selectUAVId = (_state, uavId) => uavId;

/**
 * Returns the UAV with the given ID, given the current state.
 */
export const getUAVById = (state, uavId) => state.uavs.byId[uavId];

/**
 * Returns the current position of the UAV with the given ID, given the current
 * state.
 */
export const getCurrentGPSPositionByUavId = (state, uavId) => {
  const uav = getUAVById(state, uavId);
  return uav ? uav.position : undefined;
};

/**
 * Returns the current local position of the UAV with the given ID, given the
 * current state.
 */
export const getCurrentLocalPositionByUavId = (state, uavId) => {
  const uav = getUAVById(state, uavId);
  return uav ? uav.localPosition : undefined;
};

/**
 * Returns the current heading of the UAV with the given ID, given the current
 * state.
 */
export const getCurrentHeadingByUavId = (state, uavId) => {
  const uav = getUAVById(state, uavId);
  return uav ? uav.heading : undefined;
};

/**
 * Returns the GPS-based home position of the UAV with the given ID, given the
 * current state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getGPSBasedHomePositionByUavId = createCachedSelector(
  getReverseMissionMapping,
  getGPSBasedHomePositionsInMission,
  selectUAVId,
  (revMapping, homePositions, uavId) => {
    const index = revMapping[uavId];

    if (index === undefined) {
      // UAV is not in the mission. Later on, we can return the UAV's own home
      // position here if we decide to implement that.
      return undefined;
    }

    return homePositions[index];
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the first point of the trajectory of the UAV with the given ID,
 * given the current state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getFirstPointOfTrajectoryByUavId = createCachedSelector(
  getReverseMissionMapping,
  getFirstPointsOfTrajectories,
  selectUAVId,
  (revMapping, firstPoints, uavId) => {
    const index = revMapping[uavId];

    if (index === undefined) {
      // UAV is not in the mission.
      return undefined;
    }

    return firstPoints[index];
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the takeoff heading of the UAV with the given ID, given the current
 * state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getTakeoffHeadingByUavId = createCachedSelector(
  getReverseMissionMapping,
  getTakeoffHeadingsInMission,
  selectUAVId,
  (revMapping, takeoffHeadings, uavId) => {
    const index = revMapping[uavId];

    if (index === undefined) {
      // UAV is not in the mission. Later on, we can return the UAV's own takeoff
      // heading here if we decide to implement that.
      return undefined;
    }

    return takeoffHeadings[index];
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the trajectory of the UAV with the given ID, in show coordinates,
 * given the current state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getTrajectoryPointsInShowCoordinatesByUavId = createCachedSelector(
  getReverseMissionMapping,
  getTrajectories,
  selectUAVId,
  (revMapping, trajectories, uavId) => {
    const index = revMapping[uavId];

    if (index === undefined) {
      // UAV is not in the mission
      return undefined;
    }

    const trajectory = trajectories[index];
    if (isValidTrajectory(trajectory)) {
      return getPointsOfTrajectory(trajectory, {
        includeControlPoints: true,
      });
    }

    return undefined;
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the trajectory of the UAV with the given ID, in flat Earth coordinates,
 * given the current state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getTrajectoryPointsInFlatEarthCoordinatesByUavId = createCachedSelector(
  getReverseMissionMapping,
  getTrajectories,
  getShowToFlatEarthCoordinateSystemTransformation,
  selectUAVId,
  (revMapping, trajectories, transform, uavId) => {
    const index = revMapping[uavId];

    if (transform === undefined) {
      // No coordinate system specified
      return undefined;
    }

    if (index === undefined) {
      // UAV is not in the mission
      return undefined;
    }

    const trajectory = trajectories[index];
    if (isValidTrajectory(trajectory)) {
      return getPointsOfTrajectory(trajectory, {
        includeControlPoints: true,
      }).map(transform);
    }

    return undefined;
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the trajectory of the UAV with the given ID, in world coordinates,
 * given the current state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getTrajectoryPointsInWorldCoordinatesByUavId = createCachedSelector(
  getReverseMissionMapping,
  getTrajectories,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  selectUAVId,
  (revMapping, trajectories, transform, uavId) => {
    const index = revMapping[uavId];

    if (transform === undefined) {
      // No show coordinate system yet or the show is indoor
      return undefined;
    }

    if (index === undefined) {
      // UAV is not in the mission
      return undefined;
    }

    const trajectory = trajectories[index];
    if (isValidTrajectory(trajectory)) {
      return getPointsOfTrajectory(trajectory, {
        includeControlPoints: true,
      }).map(transform);
    }

    return undefined;
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the distance of the UAV to its home position, in GPS coordinates.
 */
export const getXYDistanceToGPSBasedHomePositionByUavId = createCachedSelector(
  getGPSBasedHomePositionByUavId,
  getCurrentGPSPositionByUavId,
  (gpsHomePosition, currentGPSPosition) => {
    if (!isNil(gpsHomePosition)) {
      if (!isNil(currentGPSPosition)) {
        return haversineDistance(
          [gpsHomePosition.lon, gpsHomePosition.lat],
          [currentGPSPosition.lon, currentGPSPosition.lat]
        );
      }

      return Number.POSITIVE_INFINITY;
    }

    return undefined;
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the distance of the UAV to the first point of its trajectory, in
 * local coordinates.
 */
export const getXYDistanceToFirstPointOfTrajectoryByUavId = createCachedSelector(
  getFirstPointOfTrajectoryByUavId,
  getCurrentLocalPositionByUavId,
  (firstPoint, currentLocalPosition) => {
    if (!isNil(firstPoint)) {
      if (!isNil(currentLocalPosition)) {
        return euclideanDistance2D(firstPoint, currentLocalPosition);
      }

      return Number.POSITIVE_INFINITY;
    }

    return undefined;
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the distances of the UAVs from their home positions, restricted to the
 * UAVs that are in the mapping.
 */
export const getDistancesFromHome = (state) => {
  const mapping = getMissionMapping(state);
  const result = {};

  const distanceGetter = isShowIndoor(state)
    ? getXYDistanceToFirstPointOfTrajectoryByUavId
    : getXYDistanceToGPSBasedHomePositionByUavId;

  for (const uavId of mapping) {
    if (isNil(uavId) || !getUAVById(state, uavId)) {
      result[uavId] = undefined;
    } else {
      result[uavId] = distanceGetter(state, uavId);
    }
  }

  return result;
};

/**
 * Creates a selector that selects all UAV IDs that are in the mission mapping
 * and that either have no position or are farther from their designated home
 * than the threshold specified by the user in the UAV settings.
 */
export const getMisplacedUAVIds = createSelector(
  getDistancesFromHome,
  getDesiredPlacementAccuracyInMeters,
  (distances, threshold) =>
    // eslint-disable-next-line unicorn/no-array-reduce
    Object.entries(distances).reduce((acc, [uavId, distance]) => {
      if (distance > threshold) {
        acc.push(uavId);
      }

      return acc;
    }, [])
);

/**
 * Returns the farthest distance of an UAV from its home position, or undefined
 * if there are no UAVs with known current and home positions
 */
export const getFarthestDistanceFromHome = (state) => {
  const distancesByUavId = getDistancesFromHome(state);
  let maxDistance = -1;

  for (const distance of Object.values(distancesByUavId)) {
    if (!isNil(distance) && distance > maxDistance) {
      maxDistance = distance;
    }
  }

  return maxDistance < 0 ? undefined : maxDistance;
};

/**
 * Returns the deviation of the current heading of the UAV from the takeoff
 * heading.
 */
export const getDeviationFromTakeoffHeadingByUavId = createCachedSelector(
  getTakeoffHeadingByUavId,
  getCurrentHeadingByUavId,
  (takeoffHeading, currentHeading) => {
    if (takeoffHeading !== undefined && currentHeading !== undefined) {
      const diff = takeoffHeading - currentHeading;

      // Formula from https://stackoverflow.com/a/54820295/156771
      return ((diff + 540) % 360) - 180;
    }

    return undefined;
  }
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Returns the deviations of the headings of the UAVs from their preferred
 * headings during the mission, restricted to the UAVs that are in the mapping.
 */
export const getDeviationsFromTakeoffHeadings = (state) => {
  const mapping = getMissionMapping(state);
  const result = {};

  for (const uavId of mapping) {
    if (isNil(uavId)) {
      result[uavId] = undefined;
    } else {
      result[uavId] = getDeviationFromTakeoffHeadingByUavId(state, uavId);
    }
  }

  return result;
};

/**
 * Returns the color of the primary LED light of the UAV, in CSS notation.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getLightColorByUavIdInCSSNotation = createCachedSelector(
  getUAVById,
  (uav) => convertRGB565ToCSSNotation((uav ? uav.light : 0) || 0)
)({
  keySelector: selectUAVId,
  // TODO: use a FIFO or LRU cache if it becomes necessary.
  // The quick-lru module from npm seems simple enough.
});

/**
 * Creates a selector that selects all UAV IDs that are in the mission mapping
 * and whose headings differ from their designated takeoff headings by a threshold
 * specified in the settings of the user.
 */
export const getMisalignedUAVIds = createSelector(
  getDeviationsFromTakeoffHeadings,
  getDesiredTakeoffHeadingAccuracy,
  (deviations, threshold) =>
    // eslint-disable-next-line unicorn/no-array-reduce
    Object.entries(deviations).reduce((acc, [uavId, deviation]) => {
      if (Math.abs(deviation) > threshold) {
        acc.push(uavId);
      }

      return acc;
    }, [])
);

/**
 * Returns an array containing all the UAV IDs that appear in the mission mapping
 * but are not present in the UAV registry.
 */
export const getMissingUAVIdsInMapping = createSelector(
  getMissionMapping,
  (state) => state.uavs.byId,
  (mapping, uavsById) =>
    mapping.filter((uavId) => !isNil(uavId) && isNil(uavsById[uavId]))
);

/**
 * Returns the list of UAV IDs that the server knows about but that do not
 * participate in the mapping.
 */
export const getUnmappedUAVIds = createSelector(
  getReverseMissionMapping,
  getUAVIdList,
  (reverseMapping, uavIds) =>
    uavIds.filter((uavId) => isNil(reverseMapping[uavId]))
);

/**
 * Returns a list summarizing the error codes of all the UAVs in the mission
 * that currently have a non-zero error code.
 *
 * The returned array will contain objects of the following form:
 *
 * ```
 * {
 *   code: 3,
 *   uavIdsAndIndices: [['UAV_ID', 42], ['UAV_ID_2', 43]]
 * }
 * ```
 */
export const getErrorCodeSummaryForUAVsInMission = createSelector(
  getReverseMissionMapping,
  getUAVIdsParticipatingInMission,
  (state) => state.uavs.byId,
  (reverseMapping, uavIds, uavStatesById) => {
    const result = [];

    for (const uavId of uavIds) {
      const uavState = uavStatesById[uavId];
      if (uavState) {
        for (const code of uavState.errors) {
          result.push([code, [uavId, reverseMapping[uavId] || null]]);
        }
      }
    }

    return sortBy(
      Object.entries(groupBy(result, (item) => item[0])),
      ([code, _]) => Number.parseInt(code, 10)
    ).map(([key, value]) => ({
      code: key,
      uavIdsAndIndices: value.map((x) => x[1]),
    }));
  }
);

/**
 * Returns whether none of the UAVs in the current mission have an error code.
 */
export const areAllUAVsInMissionWithoutErrors = createSelector(
  getUAVIdsParticipatingInMission,
  (state) => state.uavs.byId,
  (uavIds, uavStatesById) => {
    for (const uavId of uavIds) {
      const uavState = uavStatesById[uavId];
      if (uavState && uavState.errors && uavState.errors.length > 0) {
        return false;
      }
    }

    return true;
  }
);

export function getSingleUAVStatusLevel(uav) {
  let severity = -1;

  if (uav.errors && uav.errors.length > 0) {
    severity = getSeverityOfMostSevereErrorCode(uav.errors);
    if (severity >= Severity.WARNING) {
      return errorSeverityToSemantics(severity);
    }
  }

  if (uav.age === UAVAge.GONE) {
    return 'off';
  }

  if (uav.age === UAVAge.INACTIVE) {
    return 'warning';
  }

  const maxError = Math.max(...uav.errors);

  if (maxError === ErrorCode.RETURN_TO_HOME) {
    return 'rth';
  }

  if (severity >= Severity.INFO) {
    return errorSeverityToSemantics(severity);
  }

  return 'success';
}

/**
 * Function that takes a drone object from the Redux store and derives the
 * generic status summary of the drone.
 *
 * The rules are as follows (the first matching rule wins);
 *
 * - If the drone has at least one error code where `(errorCode & 0xFF) >> 6`
 *   is 3, the status is "critical".
 *
 * - If the drone has at least one error code where `(errorCode & 0xFF) >> 6`
 *   is 2, the status is "error".
 *
 * - If the drone has at least one error code where `(errorCode & 0xFF) >> 6`
 *   is 1, the status is "warning".
 *
 * - If no status updates were received from the drone since a predefined
 *   longer time frame (say, 60 seconds), the status is "off". The secondary
 *   status display may also read "GONE" if there is no other message to
 *   report.
 *
 * - If no status updates were received from the drone since a predefined time
 *   frame, the status is "warning". You can distinguish this from warnings
 *   derived from error codes by looking at the secondary status display,
 *   which should read "AWAY" if there is no other warning to report.
 *
 * - If the drone is still initializing or running prearm checks, the status
 *   is "warning". You can distinguish this from warnings derived from error
 *   codes by looking at the secondary status display, which should read "INIT"
 *   or "PREARM".
 *
 * - Otherwise, the status is "success".
 */
export function getSingleUAVStatusSummary(uav) {
  let status;
  let details;
  let text;
  let textSemantics;

  if (!uav) {
    // No such UAV
    status = undefined;
    text = 'missing';
    textSemantics = 'warning';
  } else if (uav.errors && uav.errors.length > 0) {
    // UAV has some status information that it wishes to report
    const maxError = Math.max(...uav.errors);
    const severity = getSeverityOfErrorCode(maxError);

    text = abbreviateError(maxError);

    if (maxError === ErrorCode.RETURN_TO_HOME) {
      // RTH is treated separately; it is always shown as the special RTH state
      textSemantics = 'rth';
    } else if (maxError === ErrorCode.DISARMED) {
      // disarm is treated separately; it is always shown as an error
      textSemantics = 'error';
    } else {
      textSemantics = errorSeverityToSemantics(severity);
    }
  } else if (uav.position && Math.abs(uav.position.agl) >= 0.3) {
    // UAV is in the air
    text = 'airborne';
    details = `${uav.position.agl.toFixed(2)}m`;
    textSemantics = 'success';
  } else {
    // UAV is ready on the ground
    text = 'ready';
    textSemantics = 'success';
  }

  // We allow "normal" and "informational" messages to be overridden by the
  // "gone" or "inactive" warnings
  if (textSemantics === 'success' || textSemantics === 'info') {
    if (uav.age === UAVAge.GONE) {
      if (text === 'ready') {
        text = 'gone';
      }

      textSemantics = 'off';
    } else if (uav.age === UAVAge.INACTIVE) {
      if (text === 'ready') {
        text = 'inactive';
      }

      textSemantics = 'warning';
    }
  }

  if (uav) {
    status = getSingleUAVStatusLevel(uav);
  }

  return {
    status,
    details: details || text,
    gone: uav ? uav.age === UAVAge.GONE || uav.age === UAVAge.INACTIVE : false,
    text,
    textSemantics,
    batteryStatus: uav ? uav.battery : undefined,
  };
}

export const createSingleUAVStatusSummarySelector = () =>
  createSelector(getUAVById, getSingleUAVStatusSummary);
