import dateFnsFormatter from 'date-fns/format';
import isFunction from 'lodash-es/isFunction';

import { formatDurationHMS } from '~/utils/formatting';

type Clock = {
  epoch: number;
  format?: string;
  id: string;
  referenceTime?: number;
  running: boolean;
  ticks: number;
  ticksPerSecond: number;
};

export enum CommonClockId {
  SYSTEM = 'system',
  LOCAL = '__local__',
  MISSION = 'mission',
  MTC = 'mtc',
  SHOW = 'show',
  END_OF_SHOW = 'end_of_show',
}

/**
 * Remapping of commonly used clock IDs in a Skybrush server to something
 * more human-readable.
 */
const clockIdToProps: Record<
  CommonClockId,
  {
    label: string;
    abbreviation: string;
    signed?: boolean;
    affectedByClockSkew?: boolean;
  }
> = {
  [CommonClockId.SYSTEM]: {
    label: 'Server clock',
    abbreviation: 'SRV',
    affectedByClockSkew: true,
  },

  [CommonClockId.LOCAL]: {
    label: 'Client clock',
    abbreviation: 'Time',
  },

  [CommonClockId.MISSION]: {
    label: 'Mission clock',
    abbreviation: 'MSN',
    signed: true,
    affectedByClockSkew: true,
  },

  [CommonClockId.MTC]: {
    label: 'MIDI timecode',
    abbreviation: 'MTC',
  },

  [CommonClockId.SHOW]: {
    label: 'Drone show clock',
    abbreviation: 'SHOW',
    signed: true,
    affectedByClockSkew: true,
  },

  [CommonClockId.END_OF_SHOW]: {
    label: 'Time until end of show',
    abbreviation: 'END',
    signed: true,
    affectedByClockSkew: true,
  },
};

/**
 * Type guard that checks if a string represents a common clock id enum value,
 * and asserts it's type accordingly.
 */
const isCommonClockId = (id: string): id is CommonClockId =>
  Object.values(CommonClockId).includes(id as CommonClockId);

/**
 * Returns an appropriate abbreviation for a clock.
 *
 * @param clock - The clock object
 * @returns An appropriate abbreviation of the clock that represents its purpose
 */
export function formatClockAbbreviation({ id }: Clock): string {
  return isCommonClockId(id) ? clockIdToProps[id].abbreviation : 'CLK';
}

/**
 * Returns a human-readable name of a clock.
 *
 * @param clock - The clock object
 * @returns A human-readable description of the clock
 */
export function formatClockLabel({ id }: Clock): string {
  return isCommonClockId(id) ? clockIdToProps[id].label : `Clock ’${id}’`;
}

/**
 * Formats the given tick count in the context of the given clock.
 *
 * @param ticks - The number of ticks to format
 * @param clock - The clock that defines what the epoch is
 *                and how the ticks should be formatted
 * @param options - Extra options for overriding the
 *                  default format of the clock
 * @returns The formatted tick count of the clock
 */
export function formatTicksOnClock(
  ticks: number,
  clock: Clock,
  options: { format?: ((date: Date) => string) | string }
): string {
  const { epoch, ticksPerSecond } = clock;
  const { format = clock.format } = options;
  let seconds = ticks / ticksPerSecond;

  if (Number.isNaN(epoch)) {
    if (clock.id === CommonClockId.MTC) {
      // No epoch, so we just simply show a HH:MM:SS:FF SMPTE-style
      // timestamp. We (ab)use the millisecond part of the timestamp
      // to represent the number of frames
      seconds = Math.floor(seconds) + (ticks % ticksPerSecond) / 100;
      return formatDurationHMS(seconds, { padHours: true, precision: 2 });
    }

    if (ticksPerSecond <= 1) {
      // No epoch, so we just simply show a HH:MM:SS timestamp
      return formatDurationHMS(seconds, { padHours: true });
    }

    // No epoch, we show the timestamp up to 1/10th of seconds
    return formatDurationHMS(seconds, { padHours: true, precision: 1 });
  }

  // We have an epoch, so create a date and use the formatter
  const date = new Date((epoch + seconds) * 1000);
  return isFunction(format)
    ? format(date)
    : dateFnsFormatter(date, format ?? 'HH:mm:ss');
}

/**
 * Returns the current (possibly fractional) tick count on the clock.
 *
 * This function takes into account the time elapsed since the reference time
 * of the clock and whether it is running or not.
 *
 * @param clock - The clock object
 * @returns The number of ticks on the clock; possibly fractional
 */
export function getCurrentTickCountOnClock(clock: Clock): number {
  return getTickCountOnClockAt(clock, Date.now());
}

/**
 * Returns the (possibly fractional) tick count on the clock at the given UNIX
 * timestamp.
 *
 * This function takes into account the time elapsed since the reference time
 * of the clock and whether it is running or not.
 *
 * @param clock - The clock object
 * @returns The number of ticks on the clock; possibly fractional
 */
export function getTickCountOnClockAt(clock: Clock, timestamp: number): number {
  const { referenceTime = 0, running, ticks, ticksPerSecond } = clock;
  const elapsed = running ? (timestamp - referenceTime) / 1000 : 0;
  return ticks + elapsed * ticksPerSecond;
}

/**
 * Returns the preferred update frequency of the given clock.
 *
 * @param clock - The clock object
 * @returns The number of milliseconds that should pass
 *          between consecutive updates of the clock
 */
export function getPreferredUpdateIntervalOfClock(clock: Clock): number {
  if (!clock) {
    return 1000;
  }

  if (clock.ticksPerSecond > 1) {
    return Math.max(1000 / clock.ticksPerSecond, 100);
  }

  return 1000;
}

/**
 * Returns whether the given clock is affected by the clock skew between the
 * server and the client.
 */
export function isClockAffectedByClockSkew(clock: Clock): boolean {
  return Boolean(
    isCommonClockId(clock?.id) && clockIdToProps[clock.id].affectedByClockSkew
  );
}

/**
 * Returns whether the given clock is 'signed', i.e. can have a negative
 * tick count.
 */
export function isClockSigned(clock: Clock): boolean {
  return Boolean(isCommonClockId(clock?.id) && clockIdToProps[clock.id].signed);
}
