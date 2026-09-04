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
