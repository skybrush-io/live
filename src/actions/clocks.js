/**
 * @file Actions related to the handling of clocks
 */

import { createAction } from 'redux-actions';
import {
  CLEAR_CLOCK_LIST,
  SET_CLOCK_STATE,
  SET_CLOCK_STATE_MULTIPLE
} from './types';

/**
 * Action factory that creates an action that will clear the list of
 * clocks.
 */
export const clearClockList = createAction(CLEAR_CLOCK_LIST);

/**
 * Action factory that creates an action that will update the state of a
 * clock.
 *
 * @param  {string}  id     the identifier of the clock whose state has
 *                          changed
 * @param  {Object}  state  an object mapping the Redux properties of a
 *                          clock to their new values
 */
export const setClockState = createAction(SET_CLOCK_STATE);

/**
 * Action factory that creates an action that will set the state of multiple
 * clock at the same time.
 *
 * The payload of the action must be an object mapping clock IDs to
 * the fields in the Redux state object that have to be updated.
 */
export const setClockStateMultiple = createAction(SET_CLOCK_STATE_MULTIPLE);
