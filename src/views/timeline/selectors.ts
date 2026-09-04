import { createSelector } from '@reduxjs/toolkit';

import type { ShowSegment, ShowSegmentId } from '@skybrush/show-format';

import { getShowDuration, getShowSegments } from '~/features/show/selectors';
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
