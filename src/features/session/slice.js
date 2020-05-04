/**
 * @file Slice of the state object that handles the state of the user's session.
 * This slice is used to implement time-limited sessions in the web demo.
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

const { actions, reducer } = createSlice({
  name: 'session',

  initialState: {
    expiresAt: null,
    isExpired: false,
  },

  reducers: {
    // Note that there is no reducer to update the session expiry explicitly.
    // This is intentional; the session duration is set up once when the web
    // demo starts, and there is no way to extend that programmatically.

    ensureSessionExpiresNoLaterThan(state, action) {
      state.expiresAt = calculateNewExpiry(state, action.payload);
    },

    ensureSessionIsNotLongerThan(state, action) {
      const seconds = action.payload;
      if (typeof seconds === 'number' && seconds >= 0) {
        const expiry = new Date().getTime() + seconds * 1000;
        state.expiresAt = calculateNewExpiry(state, expiry);
      }
    },

    expireSession(state) {
      state.expiresAt = new Date().getTime();
      state.isExpired = true;
    },
  },
});

export const {
  ensureSessionExpiresNoLaterThan,
  ensureSessionIsNotLongerThan,
  expireSession,
} = actions;

export default reducer;
