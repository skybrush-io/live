import { createSelector } from '@reduxjs/toolkit';

import type { AppSelector } from '~/store/reducers';

import { getDroneSwarmSpecification } from './core';

export type CollectiveRTHStats = {
  total: number;
  withRTHPlan: number;
  withoutRTHPlan: number;
};

/**
 * Selector that returns an object summarizing how many drones have RTH plans.
 */
export const selectCollectiveRTHStats: AppSelector<CollectiveRTHStats> =
  createSelector(getDroneSwarmSpecification, (drones) => {
    const result = {
      total: drones.length,
      withRTHPlan: 0,
      withoutRTHPlan: 0,
    };

    for (const drone of drones) {
      const planEntries = drone.settings.rthPlan?.entries;
      if (planEntries === undefined || planEntries.length === 0) {
        result.withoutRTHPlan += 1;
      } else {
        result.withRTHPlan += 1;
      }
    }

    return result;
  });
