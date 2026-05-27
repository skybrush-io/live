import { getNextPresetIndex } from './presets';
import { getLeastUsedClockId, getLeastUsedPreset } from './selectors';
import { addClockDisplay, setPresetIndexForClockDisplay } from './slice';

import type { AppThunk } from '~/store/reducers';

/**
 * Action creator that returns an action that can be invoked with no arguments
 * and that will add a new clock to the LCD clock displays in a way that "makes
 * sense". i.e. by picking the least used clock and assigning a unique color
 * to it.
 */
export function addClockDisplayAutomatically(): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    const clockId = getLeastUsedClockId(state);
    if (!clockId) {
      return;
    }
    const action = addClockDisplay({
      clockId,
      preset: getLeastUsedPreset(state),
    });
    dispatch(action);
  };
}

/**
 * Action creator that returns an action that cycles the color preset of the
 * display with the given ID.
 */
export function cyclePreset(id: string): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    const display = state.lcdClock.byId[id];
    const preset = display ? display.preset : -1;
    dispatch(
      setPresetIndexForClockDisplay({
        id,
        preset: getNextPresetIndex(preset),
      })
    );
  };
}
