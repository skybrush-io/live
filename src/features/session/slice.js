/**
 * @file Slice of the state object that handles the state of the user's session.
 * This slice is used to store ephemeral data that should not be persisted
 * between app restarts and also to implement time-limited sessions in the web
 * demo.
 */

import { createSlice } from '@reduxjs/toolkit';

const calculateNewExpiry = (state, expiry) => {
  if (typeof expiry === 'number' && expiry >= 0) {
    if (typeof state.expiresAt === 'number') {
      return Math.min(state.expiresAt, expiry);
    } else {
      return expiry;
    }
  } else {
    return state.expiresAt;
  }
};

const updateExpiry = (state, expiry) => {
  state.expiresAt = calculateNewExpiry(state, expiry);
  if (state.expiresAt <= Date.now()) {
    state.isExpired = true;
  }
};

const { actions, reducer } = createSlice({
  name: 'session',

  initialState: {
    // Whether UAV commands should be broadcasted
    broadcast: false,

    // Expiry date/time of the current session
    expiresAt: null,

    // ID of the feature that is (or was) closest to the mouse cursor on the
    // map view
    featureIdForTooltip: null,

    // Stores whether the current session has expired
    isExpired: false,
  },

  reducers: {
    // Note that there is no reducer to update the session expiry explicitly.
    // This is intentional; the session duration is set up once when the web
    // demo starts, and there is no way to extend that programmatically.

    ensureSessionExpiresNoLaterThan(state, action) {
      updateExpiry(state, action.payload);
    },

    ensureSessionIsNotLongerThan(state, action) {
      const seconds = action.payload;
      if (typeof seconds === 'number' && seconds >= 0) {
        const expiry = Date.now() + seconds * 1000;
        updateExpiry(state, expiry);
      }
    },

    expireSession(state) {
      updateExpiry(state, Date.now());
    },

    setBroadcast(state, action) {
      state.broadcast = action.payload;
    },

    setFeatureIdForTooltip(state, action) {
      state.featureIdForTooltip = action.payload || null;
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
