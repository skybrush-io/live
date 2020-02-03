import isFunction from 'lodash-es/isFunction';
import isNil from 'lodash-es/isNil';
import moment from 'moment';

/**
 * Remapping of commonly used clock IDs in a Skybrush server to something
 * more human-readable.
 */
const clockIdRemapping = {
  system: 'Server clock',
  __local__: 'Client clock',
  mtc: 'MIDI timecode'
};

/**
 * Returns a human-readable name of a clock, given its _ID_ only.
 *
 * @param  {string} id the ID of the clock
 * @return {string} a human-readable description of the clock
 */
export function formatClockId(id) {
  return clockIdRemapping[id] || `Clock '${id}'`;
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
    if (ticksPerSecond <= 1) {
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
