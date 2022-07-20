import { setBroadcast } from './slice';
import { isBroadcast } from './selectors';

export const toggleBroadcast = () => (dispatch, getState) => {
  const state = getState();
  dispatch(setBroadcast(!isBroadcast(state)));
};
