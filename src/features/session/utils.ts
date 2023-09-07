import { type SessionSliceState } from './slice';

const calculateNewExpiry = (
  state: SessionSliceState,
  expiry: number
): number | undefined => {
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

export const updateExpiry = (
  state: SessionSliceState,
  expiry: number
): void => {
  state.expiresAt = calculateNewExpiry(state, expiry);
  if (typeof state.expiresAt === 'number' && state.expiresAt <= Date.now()) {
    state.isExpired = true;
  }
};
