import groupBy from 'lodash-es/groupBy';
import isNil from 'lodash-es/isNil';
import orderBy from 'lodash-es/orderBy';
import sortBy from 'lodash-es/sortBy';
import { getDistance as haversineDistance } from 'ol/sphere';
import { createCachedSelector } from 're-reselect';

import { createSelector } from '@reduxjs/toolkit';

import { Status } from '~/components/semantics';
import {
  getGPSBasedHomePositionsInMission,
  getMissionMapping,
  getReverseMissionMapping,
  getTakeoffHeadingsInMission,
  getUAVIdsParticipatingInMission,
} from '~/features/mission/selectors';
import {
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
} from '~/features/settings/selectors';
import {
  getFirstPointsOfTrajectories,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  getShowToFlatEarthCoordinateSystemTransformation,
  getTrajectories,
  isShowIndoor,
} from '~/features/show/selectors';
import {
  getPointsOfTrajectory,
  isValidTrajectory,
} from '~/features/show/trajectory';
import {
  errorSeverityToSemantics,
  getSeverityOfErrorCode,
  getSeverityOfMostSevereErrorCode,
  Severity,
} from '~/flockwave/errors';
import { convertRGB565ToCSSNotation } from '~/flockwave/parsing';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import { isGPSPositionValid } from '~/model/geography';
import { globalIdToUavId } from '~/model/identifiers';
import { UAVAge } from '~/model/uav';
import { selectionForSubset } from '~/selectors/selection';
import { euclideanDistance2D, getMeanAngle } from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';
import { createDeepResultSelector } from '~/utils/selectors';
import type { AppSelector, RootState } from '~/store/reducers';
import type { StoredUAV } from './types';

/**
 * Returns the list of UAV IDs that should be shown on the UI, in the
 * order preferred by the state of the application.
 *
 * @param  {Object}  state  the state of the application
 */
export const getUAVIdList = (state: RootState) => state.uavs.order;

/**
 * Key selector function for cached selectors that cache things by UAV ID.
 */
const selectUAVId = (_state: RootState, uavId: string) => uavId;

/**
 * Returns all the UAVs in a mapping.
 */
export const getUAVIdToStateMapping = (state: RootState) => state.uavs.byId;

/**
 * Returns the UAV with the given ID, given the current state.
 */
export const getUAVById = (state: RootState, uavId: string) =>
  state.uavs.byId[uavId];

/**
 * Returns the current position of the UAV with the given ID, given the current
 * state.
 */
export const getCurrentGPSPositionByUavId = (state: RootState, uavId: string) =>
  getUAVById(state, uavId)?.position;

/**
 * Returns all valid UAV positions, as defined by `isGPSPositionValid()`.
 */
export const getAllValidUAVPositions = createSelector(
  getUAVIdToStateMapping,
  (uavsById) =>
    Object.values(uavsById)
      .map((uav) => uav.position)
      .filter(isGPSPositionValid)
);

/**
 * Returns the current local position of the UAV with the given ID, given the
 * current state.
 */
export const getCurrentLocalPositionByUavId = (
  state: RootState,
  uavId: string
) => {
  const uav = getUAVById(state, uavId);
  return uav ? uav.localPosition : undefined;
};

/**
 * Returns the current heading of the UAV with the given ID, given the current
 * state.
 */
export const getCurrentHeadingByUavId = (state: RootState, uavId: string) =>
  getUAVById(state, uavId)?.heading;

/**
 * Returns the average heading of the active UAVs.
 */
export const getAverageHeadingOfActiveUAVs = (state: RootState) => {
  // Get the IDs of all active and awake UAVs. Here we exclude sleeping UAVs
  // because they may have outdated headings.
  const activeUAVIds = getActiveAndAwakeUAVIds(state);
  const headings = activeUAVIds
    .map((uavId) => getCurrentHeadingByUavId(state, uavId))
    .filter((x) => typeof x === 'number');
  return getMeanAngle(headings);
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
export const getTrajectoryPointsInFlatEarthCoordinatesByUavId =
  createCachedSelector(
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
export const getTrajectoryPointsInWorldCoordinatesByUavId =
  createCachedSelector(
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
export const getXYDistanceToFirstPointOfTrajectoryByUavId =
  createCachedSelector(
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
export const getDistancesFromHome = (
  state: RootState
): Record<string, number | undefined> => {
  const mapping = getMissionMapping(state);
  const result: Record<string, number | undefined> = {};

  const distanceGetter = isShowIndoor(state)
    ? getXYDistanceToFirstPointOfTrajectoryByUavId
    : getXYDistanceToGPSBasedHomePositionByUavId;

  for (const uavId of mapping) {
    if (isNil(uavId)) {
      /* nothing to do */
    } else if (!getUAVById(state, uavId)) {
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
    Object.entries(distances).reduce<string[]>((acc, [uavId, distance]) => {
      if (typeof distance === 'number' && distance > threshold) {
        acc.push(uavId);
      }

      return acc;
    }, [])
);

/**
 * Returns the farthest distance of an UAV from its home position, or undefined
 * if there are no UAVs with known current and home positions
 */
export const getFarthestDistanceFromHome: AppSelector<number | undefined> = (
  state
) => {
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
    if (!isNil(takeoffHeading) && !isNil(currentHeading)) {
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
export const getDeviationsFromTakeoffHeadings: AppSelector<
  Record<string, number | undefined>
> = (state) => {
  const mapping = getMissionMapping(state);
  const result: Record<string, number | undefined> = {};

  for (const uavId of mapping) {
    if (!isNil(uavId)) {
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
 * Selector factory that returns a selector that selects all UAVs whose `age`
 * property is equal to the given value.
 */
const getUAVIdsByAge =
  (age: UAVAge): AppSelector<string[]> =>
  (state) =>
    getUAVIdList(state).filter((uavId) => {
      const uav = getUAVById(state, uavId);
      return uav?.age === age;
    });

/**
 * Selector that selects all UAVs that are currently considered as "active"
 * (i.e. we have received status information from them in the last few seconds).
 */
export const getActiveUAVIds = getUAVIdsByAge(UAVAge.ACTIVE);

/**
 * Selector that selects all UAVs that are currently considered as "active"
 * (i.e. we have received status information from them in the last few seconds)
 * _and_ are also awake (i.e. not in sleep mode).
 */
export const getActiveAndAwakeUAVIds = createSelector(
  getActiveUAVIds,
  getUAVIdToStateMapping,
  (activeUAVIds, uavsById) =>
    activeUAVIds.filter((uavId) => {
      const uav = uavsById[uavId];
      return uav ? !isUAVSleeping(uav) : false;
    })
);

/**
 * Selector that selects all UAVs that are currently considered as "inactive"
 * (i.e. we have not received status information from them in the last few
 * seconds but we hope that they will re-appear).
 */
export const getInactiveUAVIds = getUAVIdsByAge(UAVAge.INACTIVE);

/**
 * Selector that selects all UAV IDs that are in the mission mapping and whose
 * headings differ from their designated takeoff headings by a threshold
 * specified in the settings of the user.
 */
export const getMisalignedUAVIds = createSelector(
  getDeviationsFromTakeoffHeadings,
  getDesiredTakeoffHeadingAccuracy,
  (deviations, threshold) =>
    Object.entries(deviations).reduce<string[]>((acc, [uavId, deviation]) => {
      if (!isNil(deviation) && Math.abs(deviation) > threshold) {
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
  getUAVIdToStateMapping,
  (mapping, uavsById) =>
    mapping.filter((uavId) => {
      if (isNil(uavId)) {
        return false;
      }

      const age = uavsById[uavId]?.age;
      return isNil(age) || age === UAVAge.GONE;
    })
);

/**
 * Selector that calculates and caches the list of selected UAV IDs from
 * the state object.
 */
export const getSelectedUAVIds = selectionForSubset(globalIdToUavId);

/**
 * Selector that returns the ID of the selected UAV if there is exactly one UAV
 * selected, or undefined otherwise.
 */
export const getSingleSelectedUAVId = createSelector(
  getSelectedUAVIds,
  (uavIds) => (uavIds.length === 1 ? uavIds[0] : undefined)
);

/**
 * Selector that returns the ID of the selected UAV in an array of length 1 if
 * there is exactly one UAV selected, or an empty array otherwise.
 */
export const getSingleSelectedUAVIdAsArray = createSelector(
  getSelectedUAVIds,
  (uavIds) => (uavIds.length === 1 ? uavIds : EMPTY_ARRAY)
);

/**
 * Selector that calculates the number of selected UAVs.
 */
export const getNumberOfSelectedUAVs: AppSelector<number> = (state) => {
  const selection = getSelectedUAVIds(state);
  return Array.isArray(selection) ? selection.length : 0;
};

/**
 * Selector that returns at most five selected UAV IDs for sake of displaying
 * their trajectories.
 */
export const getSelectedUAVIdsForTrajectoryDisplay: AppSelector<string[]> = (
  state
) =>
  getNumberOfSelectedUAVs(state) <= 5 ? getSelectedUAVIds(state) : EMPTY_ARRAY;

/**
 * Returns the IDs of all UAVs that are currently considered as "gone" (i.e. we
 * have not received status information from them in the last minute or so,
 * depending on the interval configured by the user).
 */
export const getUAVIdsMarkedAsGone = getUAVIdsByAge(UAVAge.GONE);

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
 *
 * UAVErrorCode.ON_GROUND is excluded as it is not a real error.
 */
export const getErrorCodeSummaryForUAVsInMission = createSelector(
  getReverseMissionMapping,
  getUAVIdsParticipatingInMission,
  getUAVIdToStateMapping,
  (reverseMapping, uavIds, uavStatesById) => {
    const result = [];

    for (const uavId of uavIds) {
      const uavState = uavStatesById[uavId];
      if (uavState) {
        for (const code of uavState.errors) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          if (code !== UAVErrorCode.ON_GROUND) {
            result.push([code, [uavId, reverseMapping[uavId] ?? null]]);
          }
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
 * Returns whether the given UAV state object contains an error code that is
 * worth reporting in the "Onboard preflight checks" dialog.
 */
const uavStateContainsSignificantErrorCode = (
  uavState?: StoredUAV
): boolean => {
  const { errors } = uavState ?? {};
  if (!Array.isArray(errors) || errors.length <= 0) {
    return false;
  }

  if (errors.length === 1 && errors[0] === UAVErrorCode.ON_GROUND) {
    // This is OK
    return false;
  }

  return true;
};

/**
 * Returns whether none of the UAVs in the current mission have an error code.
 */
export const areAllUAVsInMissionWithoutErrors = createSelector(
  getUAVIdsParticipatingInMission,
  getUAVIdToStateMapping,
  (uavIds, uavStatesById) => {
    for (const uavId of uavIds) {
      if (uavStateContainsSignificantErrorCode(uavStatesById[uavId])) {
        return false;
      }
    }

    return true;
  }
);

export function getSingleUAVStatusLevel(uav: StoredUAV): Status {
  let severity: Severity | undefined;

  if (uav.age === UAVAge.GONE) {
    return Status.OFF;
  }

  if (uav.errors && uav.errors.length > 0) {
    severity = getSeverityOfMostSevereErrorCode(uav.errors);
    if (severity >= Severity.WARNING) {
      return errorSeverityToSemantics(severity);
    }
  }

  if (uav.age === UAVAge.INACTIVE) {
    return Status.MISSING;
  }

  const maxError = Math.max(...uav.errors) as UAVErrorCode;

  if (maxError === UAVErrorCode.RETURN_TO_HOME) {
    return Status.RTH;
  }

  if (maxError === UAVErrorCode.ON_GROUND) {
    return Status.SUCCESS;
  }

  if (severity !== undefined && severity >= Severity.INFO) {
    return errorSeverityToSemantics(severity);
  }

  return Status.SUCCESS;
}

export const isUAVSleeping = (uav: StoredUAV): boolean =>
  uav.errors.includes(UAVErrorCode.SLEEPING);

/* eslint-disable complexity */
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
 *   which should read "NO TELEM" if there is no other warning to report.
 *
 * - Otherwise, the status is "success".
 */
export function getSingleUAVStatusSummary(uav?: StoredUAV) {
  let maxError: UAVErrorCode = UAVErrorCode.NO_ERROR;
  let status;
  let details;
  let text;
  let textSemantics;

  if (!uav) {
    // No such UAV
    status = undefined;
    text = 'missing';
    textSemantics = Status.WARNING;
  } else if (uav.errors && uav.errors.length > 0) {
    // UAV has some status information that it wishes to report
    maxError = Math.max(...uav.errors);
    const severity = getSeverityOfErrorCode(maxError);

    text = UAVErrorCode.abbreviate(maxError);

    if (maxError === UAVErrorCode.RETURN_TO_HOME) {
      // RTH is treated separately; it is always shown as the special RTH state
      textSemantics = Status.RTH;
    } else if (maxError === UAVErrorCode.ON_GROUND) {
      // "on ground" is treated separately; it is always shown in green even
      // though it's technically an info message
      textSemantics = Status.SUCCESS;
    } else {
      textSemantics = errorSeverityToSemantics(severity);
    }
  } else if (uav.position && Math.abs(uav.position.ahl ?? 0) >= 0.3) {
    // UAV is in the air
    text = 'airborne';
    details = `${(uav.position.ahl ?? 0).toFixed(2)}m`;
    textSemantics = Status.SUCCESS;
  } else {
    // UAV is ready on the ground
    text = 'ready';
    textSemantics = Status.SUCCESS;
  }

  // We allow "normal", "informational" and "warning" messages to be overridden
  // by the "gone" or "no telemetry" (inactive) warnings based on user feedback
  if (
    uav &&
    (textSemantics === Status.SUCCESS ||
      textSemantics === Status.INFO ||
      textSemantics === Status.WARNING)
  ) {
    if (uav.age === UAVAge.GONE) {
      if (text === 'ready') {
        text = 'gone';
      }

      textSemantics = Status.OFF;
    } else if (uav.age === UAVAge.INACTIVE) {
      if (text === 'ready' || maxError === UAVErrorCode.ON_GROUND) {
        text = 'no telem'; // used to be 'inactive' in earlier versions
      }

      textSemantics = Status.MISSING;
    }
  }

  if (uav) {
    status = getSingleUAVStatusLevel(uav);
  }

  return {
    age: uav?.age,
    status,
    details: details ?? text,
    gone: uav ? uav.age === UAVAge.GONE || uav.age === UAVAge.INACTIVE : false,
    text,
    textSemantics,
    batteryStatus: uav?.battery,
  };
}
/* eslint-enable complexity */

export const createSingleUAVStatusSummarySelector = () =>
  createDeepResultSelector(getUAVById, getSingleUAVStatusSummary);

/**
 * Returns the list of UAV IDs that should be shown on the UI, sorted by their
 * error codes in a descending way, such that the drones with the most severe
 * errors get placed at the beginning of the list. Only 'warnings', 'errors'
 * and 'critical errors' are considered, 'informational messages' are ignored.
 */
export const getUAVIdsSortedByErrorCode = createSelector(
  getUAVIdList,
  getUAVIdToStateMapping,
  (uavIds, uavStatesById) =>
    orderBy(
      uavIds,
      [
        (uavId) =>
          Math.max(
            ...uavStatesById[uavId]!.errors.filter(
              (e) => getSeverityOfErrorCode(e) > Severity.INFO
            )
          ),
      ],
      ['desc']
    )
);

export const getFollowMapSelectionInUAVDetailsPanel: AppSelector<boolean> = (
  state
) => state.uavs.panel.followMapSelection;

export const getSelectedTabInUAVDetailsPanel: AppSelector<string> = (state) =>
  state.uavs.panel.selectedTab;

export const getSelectedUAVIdInUAVDetailsPanel: AppSelector<
  string | undefined
> = (state) => state.uavs.panel.selectedUAVId;
