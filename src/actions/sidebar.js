/**
 * @file Action factories related to the sidebar of the app.
 */

import { createAction } from 'redux-actions';
import { TOGGLE_SIDEBAR } from './types';

/**
 * Action factory that creates an action that toggles the visibility
 * of the sidebar.
 */
export const toggleSidebar = createAction(TOGGLE_SIDEBAR);
