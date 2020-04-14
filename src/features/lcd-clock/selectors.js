import countBy from 'lodash-es/countBy';
import pickBy from 'lodash-es/pickBy';
import { createSelector } from '@reduxjs/toolkit';

import { NUM_PRESETS } from './presets';

import { getClocksInOrder } from '~/features/clocks/selectors';
import { formatClockAbbreviation } from '~/features/clocks/utils';
import { selectLast, selectOrdered } from '~/utils/collections';

/**
 * Returns the ID of the clock that is to be shown on the LCD clock display with
 * the given ID.
 *
 * @param  {object} state      the global state object
 * @param  {string} displayId  the ID of the display whose clock is to be
 *         returned
 * @return {string} the ID of the clock that is to be shown on the given LCD clock display
 */
export const getClockIdForLCDDisplayById = (state, displayId) => {
  const display = state.lcdClock.byId[displayId];
  return display ? display.clockId : undefined;
};

/**
 * Returns the index of the preset that is to be used for the LCD clock display
 * with the given ID.
 *
 * @param  {object} state      the global state object
 * @param  {string} displayId  the ID of the display whose clock is to be
 *         returned
 * @return {number} the index of the color preset that is to be used for the
 *         given LCD clock display
 */
export const getPresetIndexForLCDDisplayById = (state, displayId) => {
  const display = state.lcdClock.byId[displayId];
  return display ? display.preset : 0;
};

/**
 * Selector that returns the clocks currently known to the server, along with
 * abbreviations that are suitable to be displayed in the LCD clock panel.
 */
export const getClockIdsAndAbbreviations = createSelector(
  getClocksInOrder,
  (clocks) => {
    const result = clocks.map((clock) => ({
      id: clock.id,
      label: formatClockAbbreviation(clock),
    }));

    const counts = countBy(result, 'label');
    for (const label of Object.keys(counts)) {
      if (counts[label] > 1) {
        let index = 1;

        for (const item of result) {
          if (item.label === label) {
            item.label = `${label}${index}`;
            index++;
          }
        }
      }
    }

    return result;
  }
);

/**
 * Returns the last display in the list of LCD clock displays as shown on the UI.
 */
export const getLastLCDClockDisplay = (state) => selectLast(state.lcdClock);

/**
 * Selector that returns the LCD clock displays currently defined in the
 * client, in the order they should appear on the UI.
 */
export const getLCDClockDisplaysInOrder = createSelector(
  (state) => state.lcdClock,
  selectOrdered
);

/**
 * Returns the ID of the first clock that does _not_ appear in any of the
 * clock displays.
 *
 * If all the clocks appear on at least one display, returns the one that
 * appears on the smallest number of displays.
 *
 * If all the clocks appear in all the displays in equal counts, returns the
 * first clock ID.
 *
 * Returns undefined if there are no clocks.
 */
export const getLeastUsedClockId = (state) => {
  const { byId, order } = state.lcdClock;
  const shownClockIds = order
    .map((displayId) => (byId[displayId] ? byId[displayId].clockId : undefined))
    .filter(Boolean);

  for (const clock of getClocksInOrder(state)) {
    if (!shownClockIds.includes(clock.id)) {
      return clock.id;
    }
  }

  // All the clocks are visible on at least one display
  const counts = countBy(shownClockIds);
  const minCount = Math.min(...Object.values(counts));
  const candidates = Object.keys(pickBy(counts, (value) => value === minCount));

  candidates.sort();

  return candidates[0];
};

/**
 * Returns the indx of the first color preset that is _not_ used in any of the
 * clock displays.
 *
 * If all the prests are used in at least one of the displays, returns the one
 * that appears on the smallest number of displays.
 *
 * If all the presets are used in all the displays in equal counts, returns the
 * preset with the smallest index.
 *
 * Returns zero if there are no presets yet.
 */
export const getLeastUsedPreset = (state) => {
  const { byId, order } = state.lcdClock;
  const counts = new Array(NUM_PRESETS).fill(0);
  for (const displayId of order) {
    const display = byId[displayId];
    if (
      display &&
      typeof display.preset === 'number' &&
      display.preset >= 0 &&
      display.preset < NUM_PRESETS
    ) {
      counts[display.preset]++;
    }
  }

  return counts.indexOf(Math.min(...counts));
};
