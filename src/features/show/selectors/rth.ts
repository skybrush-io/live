import { createSelector } from '@reduxjs/toolkit';

import type { AppSelector } from '~/store/reducers';

import { validateCollectiveRTHPlan } from '../validators';
import { getDroneSwarmSpecification } from './core';

import type { Timestamp } from '@skybrush/flockwave-spec';

export type CollectiveRTHPlanSummaryItem = {
  /**
   * The time stamp for which this summary item is calculated for.
   */
  time: Timestamp;

  /**
   * Maximum duration of the collective RTH plan at this time.
   *
   * The value may be zero, for example if the corresponding plans
   * have only landing entries.
   */
  maxDuration: number;
};

export type CollectiveRTHPlanSummary = {
  plans: Record<Timestamp, CollectiveRTHPlanSummaryItem>;
  isValid: boolean;
  firstTime?: Timestamp;
  lastTime?: Timestamp;
  numDrones: number;
  dronesWithRTHPlan: number;
  dronesWithoutRTHPlan: number;
};

export const selectCollectiveRTHPlanSummary: AppSelector<CollectiveRTHPlanSummary> =
  createSelector(getDroneSwarmSpecification, (drones) =>
    validateCollectiveRTHPlan(drones)
  );
