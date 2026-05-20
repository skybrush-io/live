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

export const selectCollectiveRTHSchedule: AppSelector<Schedule | undefined> = (
  state
) => state.show.collectiveRTHSchedule;

export const selectIsCollectiveRTHTriggered: AppSelector<boolean> = (state) =>
  state.show.collectiveRTHSchedule !== undefined;
