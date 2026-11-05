/**
 * @file Slice of the state object that stores the status of the light control
 * panel in the appplication.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { registerEventHandlers } from '~/model/events';
import type { AppThunk } from '~/store/reducers';

type LightControlSliceState = {
  active: boolean;
  color: string;
};

const initialState: LightControlSliceState = {
  active: false,
  color: '#ffffff',
};

// TODO: Remove unnecessary type checks and conversions!
const { actions, reducer } = createSlice({
  name: 'light-control',
  initialState,
  reducers: {
    // Internal action; do not use directly unless you know what you are
    // doing because chances are that you need a side effect that informs
    // the server about the change.
    setColor(state, action: PayloadAction<string>) {
      if (typeof action.payload === 'string') {
        state.color = action.payload;
      }
    },

    // Internal action; do not use directly unless you know what you are
    // doing because chances are that you need a side effect that informs
    // the server about the change.
    setLightControlActive(state, action: PayloadAction<boolean>) {
      state.active = Boolean(action.payload);
    },
  },
});

export const {
  // Internal actions; do not use directly unless you know what you are
  // doing because chances are that you need a side effect that informs
  // the server about the change.
  setColor,
  setLightControlActive,
} = actions;

const unregisterEventHandlers = registerEventHandlers({
  // The actions are imported lazily because they import the message hub, which
  // in turn imports the store. The store imports this slice, so importing the
  // actions here would make the store depend on itself while it is loading.
  'show:lights': (): AppThunk<Promise<void>> => async (dispatch) => {
    const { updateLightControlFromServer } = await import('./actions');
    dispatch(updateLightControlFromServer());
  },
});
if (module.hot) {
  module.hot.dispose(unregisterEventHandlers);
}

export default reducer;
