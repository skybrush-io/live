/**
 * @file Slice of the state object that handles the state of the user's session.
 * This slice is used to store ephemeral data that should not be persisted
 * between app restarts and also to implement time-limited sessions in the web
 * demo.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { type Identifier } from '~/utils/collections';

import { updateExpiry } from './utils';

export type SessionSliceState = ReadonlyDeep<{
  /** Whether UAV commands should be broadcast */
  broadcast: boolean;

  /** Expiry date/time of the current session */
  expiresAt?: number;

  /**
   * ID of the feature that is (or was) closest
   * to the mouse cursor on the map view
   */
  featureIdForTooltip?: Identifier;

  /** Whether the current session has expired */
  isExpired: boolean;
}>;

const initialState: SessionSliceState = {
  broadcast: false,
  expiresAt: undefined,
  featureIdForTooltip: undefined,
  isExpired: false,
};

const { actions, reducer } = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Note that there is no reducer to update the session expiry explicitly.
    // This is intentional; the session duration is set up once when the web
    // demo starts, and there is no way to extend that programmatically.

    ensureSessionExpiresNoLaterThan(state, action: PayloadAction<number>) {
      updateExpiry(state, action.payload);
    },

    ensureSessionIsNotLongerThan(state, action: PayloadAction<number>) {
      const seconds = action.payload;
      if (typeof seconds === 'number' && seconds >= 0) {
        const expiry = Date.now() + seconds * 1000;
        updateExpiry(state, expiry);
      }
    },

    expireSession(state) {
      updateExpiry(state, Date.now());
    },

    setBroadcast(state, action: PayloadAction<boolean>) {
      state.broadcast = Boolean(action.payload);
    },

    setFeatureIdForTooltip(
      state,
      action: PayloadAction<Identifier | undefined>
    ) {
      state.featureIdForTooltip = action.payload;
    },
  },
});

export const {
  setBroadcast,
  ensureSessionExpiresNoLaterThan,
  ensureSessionIsNotLongerThan,
  expireSession,
  setFeatureIdForTooltip,
} = actions;

export default reducer;
