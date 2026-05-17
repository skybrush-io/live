import isObject from 'lodash-es/isObject';

export type TimeSegmentType = 'preparation' | 'rth' | 'slowdown' | 'speedup';

const VALID_TIME_SEGMENT_TYPES = new Set<TimeSegmentType>([
  'preparation',
  'rth',
  'slowdown',
  'speedup',
]);

/**
 * Object that describes a time segment in a schedule.
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
 * Object that represents a schedule that consists of an ordered
 * array of time segments.
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
