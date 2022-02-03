/**
 * @file Action factories related to the map in the main app window.
 */

import { createAction } from 'redux-actions';
import { SELECT_MAP_SOURCE } from './types';

/**
 * Action factory that creates an action that selects a given source in the
 * map toolbar.
 */
export const selectMapSource = createAction(SELECT_MAP_SOURCE);
