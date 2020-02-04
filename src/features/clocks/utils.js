import isFunction from 'lodash-es/isFunction';
import isNil from 'lodash-es/isNil';
import moment from 'moment';

/**
 * Remapping of commonly used clock IDs in a Skybrush server to something
 * more human-readable.
 */
const clockIdToProps = {
  system: {
    label: 'Server clock',
    abbreviation: 'SRV'
  },

  __local__: {
    label: 'Client clock',
    abbreviation: 'Time'
  },

  mission: {
    label: 'Mission clock',
    abbreviation: 'MSN'
  },

  mtc: {
    label: 'MIDI timecode',
    abbreviation: 'MTC'
  },

  show: {
    label: 'Drone show clock',
    abbreviation: 'Show'
  }
};

/**
 * Returns a human-readable name of a clock, given its _ID_ only.
 *
 * @param  {string} id the ID of the clock
 * @return {string} a human-readable description of the clock
 */
export function formatClockById(id) {
  const props = clockIdToProps[id];
  return (props ? props.label : null) || `Clock '${id}'`;
}

/**
 * Returns an appropriate abbreviation for a clock.
 *
 * @param  {object}  clock  the clock object
 * @return {string}  an appropriate abbreviation of the clock that represents
 *         its purpse
 */
export function formatClockAbbreviation(clock) {
  const props = clock ? clockIdToProps[clock.id] : null;
  return (props ? props.abbreviation : null) || 'CLK';
}

/**
 * Returns a human-readable name of a clock.
 *
 * @param  {object}  clock  the clock object
 * @return {string}  a human-readable description of the clock
 */
export function formatClockLabel(clock) {
  return clock ? formatClockById(clock.id) : '';
}

/**
 * Formats the given tick count in the context of the given clock.
 *
 * @param  {number}  ticks  the number of ticks to format
 * @param  {object}  clock  the clock that defines what the epoch is and how
 *         the ticks should be formatted
 * @param  {object}  options  extra options for overriding the default format
 *         of the clock
 * @return {string}  the formatted tick count of the clock
 */
export function formatTicksOnClock(ticks, clock, options) {
  const { epoch, ticksPerSecond } = clock;
  const { format = clock.format } = options;

  if (isNil(epoch) || isNaN(epoch)) {
    if (clock.id !== 'mtc' && ticksPerSecond <= 1) {
      // No epoch, so we just simply show a HH:MM:SS timestamp
      return moment
        .utc(0)
        .add(Math.floor(ticks / ticksPerSecond), 'second')
        .format('HH:mm:ss');
    }

    // No epoch, so we just simply show a HH:MM:SS:FF SMPTE-style
    // timestamp. We (ab)use the millisecond part of the timestamp
    // to represent the number of frames
    return moment
      .utc(0)
      .add(Math.floor(ticks / ticksPerSecond), 'second')
      .add((ticks % ticksPerSecond) * 10, 'millisecond')
      .format('HH:mm:ss:SS');
  }

  // We have an epoch, so create a date and use the formatter
  const date = moment.unix(epoch + ticks / ticksPerSecond);
  return isFunction(format) ? format(date) : date.format(format);
}

/**
 * Returns the current (possibly fractional) tick count on the clock.
 *
 * This function takes into account the time elapsed since the reference time
 * of the clock and whether it is running or not.
 *
 * @param {object} clock  the clock object
 * @return {number} the number of ticks on the clock; possibly fractional
 */
export function getCurrentTickCountOnClock(clock) {
  const { referenceTime, running, ticks, ticksPerSecond } = clock;
  const elapsed = running ? (moment().valueOf() - referenceTime) / 1000 : 0;
  return ticks + elapsed * ticksPerSecond;
}

/**
 * Returns the preferred update frequency of the given clock.
 *
 * @param {object} clock  the clock object
 * @return {number}  the number of milliseconds that should pass between
 *         consecutive updates of the flock
 */
export function getPreferredUpdateIntervalOfClock(clock) {
  if (!clock) {
    return 1000;
  }

  if (clock.updateInterval) {
    return clock.updateInterval;
  }

  if (clock.ticksPerSecond > 1) {
    return Math.max(1000 / clock.ticksPerSecond, 100);
  }

  return 1000;
}
