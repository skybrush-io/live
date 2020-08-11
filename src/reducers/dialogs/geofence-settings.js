/**
 * @file Reducer function for handling the part of the state object that
 * stores parameters for the automatic geofence generation process.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

import { MAX_GEOFENCE_VERTEX_COUNT } from '~/features/show/constants';

/**
 * The default settings for the part of the state object being defined here.
 */
const defaultState = {
  dialogVisible: false,
  margin: 20,
  simplify: true,
  maxVertexCount: MAX_GEOFENCE_VERTEX_COUNT,
};

/**
 * The reducer function that handles actions related to the geofence settings.
 */
const reducer = handleActions(
  {
    SHOW_GEOFENCE_SETTINGS_DIALOG: (state) => u({ dialogVisible: true }, state),

    CLOSE_GEOFENCE_SETTINGS_DIALOG: (state) =>
      u({ dialogVisible: false }, state),

    UPDATE_GEOFENCE_SETTINGS: (state, action) => u(action.payload, state),
  },
  defaultState
);

export default reducer;
