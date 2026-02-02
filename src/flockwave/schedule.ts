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

function isTimeSegment(data: unknown): data is TimeSegment {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const segment = data as Record<string, unknown>;
  return (
    VALID_TIME_SEGMENT_TYPES.has(segment.type as TimeSegmentType) &&
    typeof segment.startMs === 'number' &&
    typeof segment.endMs === 'number' &&
    (segment.params === undefined ||
      (typeof segment.params === 'object' && segment.params !== null))
  );
}

export function isSchedule(data: unknown): data is Schedule {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.schedule)) {
    return false;
  }

  for (const segment of record.schedule) {
    if (!isTimeSegment(segment)) {
      return false;
    }
  }

  return true;
}
