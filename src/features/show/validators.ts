import type { RTHPlan, RTHPlanEntry } from '@skybrush/file-formats-doc/skyc';
import type { DroneSpecification } from '@skybrush/show-format';

import type {
  CollectiveRTHPlanSummary,
  CollectiveRTHPlanSummaryItem,
} from './selectors';

type RTHAction = RTHPlanEntry['action'];

const VALID_RTH_ACTIONS: ReadonlySet<RTHAction> = new Set<RTHAction>([
  'land',
  'goToKeepAlt',
  'goToStraight',
]);

/**
 * Returns whether the timestamp of the given RTH plan entry is valid.
 */
function isEntryTimestampValid(entry: RTHPlanEntry): boolean {
  const time = entry.time;
  return Number.isInteger(time) && time >= 0;
}

/**
 * Returns the duration of the given RTH plan entry, or `undefined` if the entry
 * does not have a valid duration.
 */
function calculateEntryDurationWithoutLanding(
  entry: RTHPlanEntry
): number | undefined {
  // Pre-delay is present in all entry types
  const preDelay = entry.preDelay ?? 0;
  if (preDelay < 0) {
    return undefined;
  }

  // Shortcut for the simpler land entries.
  if (entry.action === 'land') {
    return preDelay;
  }

  const duration = entry.duration;
  const postDelay = entry.postDelay ?? 0;

  if (duration < 0 || postDelay < 0) {
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

function calculateLandingDuration(plan: RTHPlan, entry: RTHPlanEntry): number {
  const targetZ =
    Array.isArray(entry.target) &&
    entry.target.length === 3 &&
    typeof entry.target[2] === 'number'
      ? entry.target[2]
      : 0;
  const landingAltitude =
    typeof entry.landingAltitude === 'number'
      ? entry.landingAltitude
      : (plan.landingAltitude ?? 0);
  const landingDistance = Math.abs(
    targetZ - landingAltitude
  );
  return landingDistance / plan.landingSpeed;
}

/**
 * Returns whether the given RTH plan entry is valid.
 */
function isValidRTHPlanEntry(entry: RTHPlanEntry): boolean {
  if (!isEntryTimestampValid(entry)) {
    return false;
  }

  if (!VALID_RTH_ACTIONS.has(entry.action)) {
    return false;
  }

  return (
    Array.isArray(entry.target) &&
    entry.target.length === 3 &&
    entry.target.every((value) => typeof value === 'number')
  );
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
    const landingSpeed =
      typeof rthPlan?.landingSpeed === 'number' ? rthPlan.landingSpeed : 0;
    if (
      rthPlan === undefined ||
      rthPlan.entries.length === 0 ||
      landingSpeed <= 0
    ) {
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

      const durationWithoutLanding =
        calculateEntryDurationWithoutLanding(entry);
      if (durationWithoutLanding === undefined) {
        console.warn(
          'Invalid duration for RTH plan entry for drone at index',
          drones.indexOf(drone)
        );
        continue;
      }

      const duration =
        durationWithoutLanding + calculateLandingDuration(rthPlan, entry);

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

  const isValid =
    dronesWithoutRTHPlan === 0 &&
    dronesWithRTHPlan === numDrones &&
    Object.values(plans).every((summary) => summary?.count === numDrones);

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
