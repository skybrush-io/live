import type { RTHPlanEntry } from '@skybrush/file-formats-doc/skyc';

import type { DroneSpecification } from '@skybrush/show-format';

import type {
  CollectiveRTHPlanSummary,
  CollectiveRTHPlanSummaryItem,
} from './selectors/rth';

type RTHAction = RTHPlanEntry['action'];

const VALID_RTH_ACTIONS: ReadonlySet<RTHAction> = new Set<RTHAction>([
  'land',
  'goToKeepAlt',
  'goToStraight',
]);

/**
 * Returns the timestamp of the given RTH plan entry, or `undefined` if the entry
 * does not have a valid timestamp.
 */
function validateEntryTimestamp(entry: RTHPlanEntry): number | undefined {
  const time = entry.time;
  return Number.isInteger(time) && time >= 0 ? time : undefined;
}

/**
 * Returns the duration of the given RTH plan entry, or `undefined` if the entry
 * does not have a valid duration.
 */
function calculateEntryDuration(entry: RTHPlanEntry): number | undefined {
  if (entry.action === 'land') {
    return undefined;
  }

  const duration = entry.duration;
  const preDelay = entry.preDelay ?? 0;
  const postDelay = entry.postDelay ?? 0;

  if (preDelay < 0 || duration < 0 || postDelay < 0) {
    return undefined;
  }

  const result = preDelay + duration + postDelay;
  if (entry.action === 'goToKeepAlt') {
    return result;
  }

  const preNeckDuration = entry.preNeckDuration ?? 0;
  if (preNeckDuration < 0) {
    return undefined;
  }

  return result + preNeckDuration;
}

/**
 * Returns whether the given RTH plan entry is valid.
 */
function isValidRTHPlanEntry(entry: RTHPlanEntry): boolean {
  if (validateEntryTimestamp(entry) === undefined) {
    return false;
  }

  if (!VALID_RTH_ACTIONS.has(entry.action)) {
    return false;
  }

  if (entry.action === 'goToKeepAlt') {
    if (entry.target.length !== 2) {
      return false;
    }
  } else if (entry.action === 'goToStraight') {
    if (entry.target.length !== 3) {
      return false;
    }
  }

  return true;
}

/**
 * Validates the collective RTH plan of the given array of drones,
 * and returns the validation result.
 */
export function validateCollectiveRTHPlan(
  drones: DroneSpecification[]
): CollectiveRTHPlanSummary {
  const numDrones = drones.length;
  if (numDrones === 0) {
    return {
      plans: {},
      isValid: false,
      firstTime: undefined,
      lastTime: undefined,
      numDrones: 0,
      dronesWithRTHPlan: 0,
      dronesWithoutRTHPlan: 0,
    };
  }

  let dronesWithRTHPlan = 0;
  let dronesWithoutRTHPlan = 0;
  let firstTime: number = Number.POSITIVE_INFINITY;
  let lastTime: number = Number.NEGATIVE_INFINITY;
  const plans: Record<
    number,
    (CollectiveRTHPlanSummaryItem & { count: number }) | undefined
  > = {};

  for (const drone of drones) {
    const rthPlan = drone.settings.rthPlan;
    if (rthPlan === undefined || rthPlan.entries.length === 0) {
      dronesWithoutRTHPlan++;
      continue;
    } else {
      dronesWithRTHPlan++;
    }

    for (const entry of rthPlan.entries) {
      if (!isValidRTHPlanEntry(entry)) {
        console.warn(
          'Invalid RTH plan entry for drone at index',
          drones.indexOf(drone)
        );
        continue;
      }

      const duration = calculateEntryDuration(entry);
      if (duration === undefined && entry.action !== 'land') {
        console.warn(
          'Invalid duration for RTH plan entry for drone at index',
          drones.indexOf(drone)
        );
        continue;
      }

      const time = entry.time;
      if (time < firstTime) {
        firstTime = time;
      }
      if (time > lastTime) {
        lastTime = time;
      }

      const existing = plans[time];
      if (existing === undefined) {
        plans[time] = {
          time,
          count: 1,
          // Use 0 for landing, other actions have a duration.
          maxDuration: duration ?? 0,
        };
      } else {
        existing.count += 1;
        if (duration !== undefined && duration > existing.maxDuration) {
          existing.maxDuration = duration;
        }
      }
    }
  }

  let isValid = dronesWithRTHPlan === numDrones && dronesWithoutRTHPlan === 0;
  if (isValid) {
    for (const summary of Object.values(plans)) {
      if (summary?.count !== numDrones) {
        isValid = false;
        break;
      }
    }
  }

  return {
    plans: plans as Record<number, CollectiveRTHPlanSummaryItem>,
    isValid,
    firstTime,
    lastTime,
    numDrones,
    dronesWithRTHPlan,
    dronesWithoutRTHPlan,
  };
}
