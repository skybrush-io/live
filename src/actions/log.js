/**
 * @file Action factories related to the event log.
 */

import { createAction } from 'redux-actions';
import {
  ADD_LOG_ITEM,
  CLEAR_LOG_ITEMS,
  DELETE_LOG_ITEM,
  UPDATE_LOG_PANEL_VISIBILITY
} from './types';

/**
 * Action factory that creates an action that adds and event log item.
 */
export const addLogItem = createAction(ADD_LOG_ITEM);

/**
 * Action factory that creates an action that deletes a given event log item.
 */
export const deleteLogItem = createAction(DELETE_LOG_ITEM);

/**
 * Action factory that creates an action that clears all the event log items.
 */
export const clearLogItems = createAction(CLEAR_LOG_ITEMS);

/**
 * Action factory that creates an action that notifies the state store that
 * the visibility of the log panel has changed.
 */
export const updateLogPanelVisibility = createAction(
  UPDATE_LOG_PANEL_VISIBILITY
);
