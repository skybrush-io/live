import { createSelector } from '@reduxjs/toolkit';

import type { ShowSegment, ShowSegmentId } from '@skybrush/show-format';
import { createTrajectoryPlayer } from '@skybrush/show-format';
import type {
  AltitudeEnvelope,
  DistanceEnvelope,
} from '@skybrush/show-metrics';
import {
  getMinimumAndMaximumAltitudesAt,
  getMinimumAndMaximumDistancesFromHomeAt,
} from '@skybrush/show-metrics';

import { COLLECTIVE_RTH_TIMING } from '~/features/show/constants';
import {
  getShowDuration,
  getShowSegments,
  getTrajectories,
  selectCollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import type { AppSelector } from '~/store/reducers';
import { EMPTY_ARRAY } from '~/utils/redux';

/**
 * Returns uniformly sampled timestamps from the range starting from zero up to
 * the end of the show, in seconds, with one timestamp per second.
 */
export const getShowTimelineTimestamps: AppSelector<number[]> = createSelector(
  getShowDuration,
  (duration) =>
    typeof duration === 'number' && duration >= 0
      ? Array.from({ length: Math.ceil(duration) + 1 }, (_, index) => index)
      : EMPTY_ARRAY
);

const getShowTimelineTrajectoryPlayers = createSelector(
  getTrajectories,
  (trajectories) =>
    trajectories.flatMap((trajectory) =>
      trajectory ? [createTrajectoryPlayer(trajectory)] : []
    )
);

/**
 * Returns the minimum and maximum altitude of the swarm at each timeline
 * timestamp.
 */
export const getShowTimelineAltitudeRange: AppSelector<AltitudeEnvelope> =
  createSelector(
    getShowTimelineTrajectoryPlayers,
    getShowTimelineTimestamps,
    getMinimumAndMaximumAltitudesAt
  );

/**
 * Returns the minimum and maximum distance of the swarm from each drone's
 * home position at each timeline timestamp.
 */
export const getShowTimelineDistanceFromHomeRange: AppSelector<DistanceEnvelope> =
  createSelector(
    getShowTimelineTrajectoryPlayers,
    getShowTimelineTimestamps,
    getMinimumAndMaximumDistancesFromHomeAt
  );

/**
 * Returns the expected time to bring the fleet home when collective RTH is
 * triggered at each timeline timestamp.
 *
 * If collective RTH cannot be triggered because there is no eligible valid
 * plan, returns the remaining show duration instead.
 */
export const getShowTimelineRTHDurations: AppSelector<number[]> =
  createSelector(
    getShowTimelineTimestamps,
    getShowDuration,
    selectCollectiveRTHPlanSummary,
    (timestamps, showDuration, rthPlanSummary) => {
      const plans = rthPlanSummary.isValid
        ? Object.values(rthPlanSummary.plans).sort((a, b) => a.time - b.time)
        : EMPTY_ARRAY;
      const duration = showDuration ?? 0;

      // The offset between the current show clock time and the timestamp of the earliest
      // RTH plan that can be triggered at that time, in seconds. This includes the
      // time it takes to broadcast the RTH command to the drones, and the time elapsed
      // on the show clock on the drones during the slowdown phase.
      const minimumPlanStartTimeOffset =
        COLLECTIVE_RTH_TIMING.broadcastDuration +
        COLLECTIVE_RTH_TIMING.slowdownDurationInShowTime;

      return timestamps.map((timestamp) => {
        // Find the first plan that is no earlier than the current timestamp plus the
        // minimum offset.
        const plan = plans.find(
          ({ time }) => time >= timestamp + minimumPlanStartTimeOffset
        );

        // The selected plan will be executed at plan.time so there's a waiting period
        // of (plan.time - timestamp), plus the duration of the plan itself. If no such
        // plan exists, return the remaining show duration instead.
        return plan
          ? plan.time + plan.maxDuration - timestamp
          : Math.max(duration - timestamp, 0);
      });
    }
  );

const RELEVANT_SHOW_SEGMENT_IDS: ShowSegmentId[] = ['show'];

/**
 * Returns the relevant show segments, sorted by their start times in
 * ascending order.
 *
 * Currently we show the main "show" segment only; we can revise this later.
 */
export const getRelevantShowSegmentsSortedByStartTime: AppSelector<
  Array<[ShowSegmentId, ShowSegment]>
> = createSelector(getShowSegments, (segments) => {
  const result: Array<[ShowSegmentId, ShowSegment]> = [];
  for (const id of RELEVANT_SHOW_SEGMENT_IDS) {
    const segment = segments?.[id];
    if (segment) {
      result.push([id, segment]);
    }
  }
  return result.sort((a, b) => a[1][0] - b[1][0]);
});
