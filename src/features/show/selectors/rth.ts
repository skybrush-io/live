import { createSelector } from '@reduxjs/toolkit';

import type { Schedule } from '~/flockwave/schedule';
import type { AppSelector } from '~/store/reducers';

import { validateCollectiveRTHPlan } from '../validators';
import { getDroneSwarmSpecification } from './core';

export type CollectiveRTHPlanSummaryItem = {
  /**
   * The timestamp for which this summary item is calculated for.
   */
  time: number;

  /**
   * Maximum duration of the collective RTH plan at this time.
   *
   * The value may be zero, for example if the corresponding plans
   * have only landing entries.
   */
  maxDuration: number;
};

export type CollectiveRTHPlanSummary = {
  plans: Record<number, CollectiveRTHPlanSummaryItem>;
  isValid: boolean;
  firstTime?: number;
  lastTime?: number;
  numDrones: number;
  dronesWithRTHPlan: number;
  dronesWithoutRTHPlan: number;
};

export const selectCollectiveRTHPlanSummary: AppSelector<CollectiveRTHPlanSummary> =
  createSelector(getDroneSwarmSpecification, (drones) =>
    validateCollectiveRTHPlan(drones)
  );

/**
 * Returns the minimum (and arrival) altitude of the RTH plan entries of the
 * currently loaded show that involve horizontal motion, or `undefined` if the
 * show has no such entries or the plan is partial.
 */
export const selectMinRTHAltitude: AppSelector<number | undefined> =
  createSelector(getDroneSwarmSpecification, (drones) => {
    let result: number | undefined;

    for (const drone of drones) {
      const entries = drone.settings.rthPlan?.entries ?? [];
      if (entries.length === 0) {
        return undefined;
      }

      for (const entry of entries) {
        if (entry.action !== 'land') {
          result =
            result === undefined
              ? entry.target[2]
              : Math.min(result, entry.target[2]);
        }
      }
    }

    return result;
  });

/**
 * Returns the timestamps, in ascending order, for which the currently loaded
 * show has collective RTH plans.
 */
export const selectCollectiveRTHPlanTimestamps: AppSelector<number[]> =
  createSelector(selectCollectiveRTHPlanSummary, ({ plans }) =>
    Object.keys(plans)
      .map(Number)
      .sort((a, b) => a - b)
  );

export const selectShowControlSchedule: AppSelector<Schedule | undefined> = (
  state
) => state.show.showControlSchedule;

/**
 * Returns whether a collective RTH operation has been triggered by the operator
 * according to the current show control schedule.
 *
 * @returns whether the show control schedule contains at least one segment of type 'rth'
 */
export const selectIsCollectiveRTHTriggered: AppSelector<boolean> = (state) => {
  const { showControlSchedule } = state.show;
  return showControlSchedule
    ? showControlSchedule.schedule.some((entry) => entry.type === 'rth')
    : false;
};
