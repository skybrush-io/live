import isObject from 'lodash-es/isObject';

/**
 * Type of a single segment in a drone show schedule.
 *
 * - `show` represents the regular, pre-planned drone show.
 * - `preparation` is a time period during which we are sending commands to drones in
 *   order to alter the schedule of the show, e.g. to prepare for a collective RTH.
 * - `rth` is a time period during which the drones are executing a collective RTH.
 * - `slowdown` is a time period during which the show is slowed down, typically from
 *   its normal speed to a standstill, in order to smootly start a collective RTH from
 *   a safe configuration. Slowdown is also used if the show is temporarily suspended.
 * - `speedup` is a time period during which the show is sped up, typically from a
 *   standstill to its normal speed. This is used to resume a suspended show.
 */
export type TimeSegmentType =
  | 'preparation'
  | 'rth'
  | 'slowdown'
  | 'speedup'
  | 'show';

const VALID_TIME_SEGMENT_TYPES = new Set<TimeSegmentType>([
  'preparation',
  'rth',
  'slowdown',
  'speedup',
  'show',
]);

/**
 * Object that describes a time segment in a drone show schedule.
 */
export type TimeSegment = {
  /**
   * The type of the time segment.
   */
  type: TimeSegmentType;

  /**
   * The start timestamp of the time segment in milliseconds.
   */
  startMs: number;

  /**
   * The end timestamp of the time segment in milliseconds.
   */
  endMs: number;

  /**
   * Optional extra parameters, the value depends on what the
   * time segment represents.
   */
  params?: Record<string, unknown>;
};

/**
 * Object that represents a drone show schedule that consists of an ordered array of
 * time segments.
 */
export type Schedule = {
  schedule: TimeSegment[];
};

const isTimeSegment = (data: unknown): data is TimeSegment =>
  // prettier-ignore
  isObject(data)
  && 'type' in data && VALID_TIME_SEGMENT_TYPES.has(data.type as TimeSegmentType)
  && 'startMs' in data && typeof data.startMs === 'number'
  && 'endMs' in data && typeof data.endMs === 'number'
  && (!('params' in data) || data.params === undefined || isObject(data.params));

export const isSchedule = (data: unknown): data is Schedule =>
  // prettier-ignore
  isObject(data)
  && 'schedule' in data
  && Array.isArray(data.schedule)
  && data.schedule.every(isTimeSegment);

export type SegmentStage = 'waiting' | 'active' | 'completed';

export type SegmentProgress = {
  durationMs: number;
  elapsedMs: number;
  remainingMs: number;
  progress: number;
  stage: SegmentStage;
  waitingMs: number;
};

/**
 * Calculates detailed progress information about a time segment in a drone show
 * schedule based on the current timestamp.
 *
 * @param segment  the time segment for which to calculate progress
 * @param nowMs  the current timestamp in milliseconds
 */
export function calculateSegmentProgress(
  segment: TimeSegment,
  nowMs: number
): SegmentProgress {
  const durationMs = Math.max(segment.endMs - segment.startMs, 0);
  const elapsedMs = Math.max(Math.min(nowMs - segment.startMs, durationMs), 0);
  const remainingMs = Math.max(segment.endMs - nowMs, 0);
  const progress =
    durationMs > 0
      ? Math.min(Math.floor((elapsedMs / durationMs) * 100), 100)
      : 100;
  let waitingMs = 0;

  let stage: SegmentStage;
  if (nowMs < segment.startMs) {
    stage = 'waiting';
    waitingMs = segment.startMs - nowMs;
  } else if (progress < 100) {
    stage = 'active';
  } else {
    stage = 'completed';
  }

  return { durationMs, elapsedMs, remainingMs, progress, stage, waitingMs };
}

/**
 * Given a list of time segments ordered by their start time, returns the first one
 * that is either active right now or that will be active in the future. If all segments
 * are completed, returns undefined.
 */
export function findCurrentOrNextTimeSegment(
  schedule: TimeSegment[],
  nowMs: number
): TimeSegment | undefined {
  for (const segment of schedule) {
    if (nowMs < segment.endMs) {
      return segment;
    }
  }
  return undefined;
}
