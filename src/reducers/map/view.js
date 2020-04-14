/**
 * @file Reducer function for handling the center, zoom level and rotation of
 * the map.
 *
 * Due to how OpenLayers works, we cannot make the Redux store the single source
 * of truth for the center, zoom level and rotation of the map. When the map
 * view is visible, the view manages its own center, zoom level and rotation,
 * and dispatches actions to update the stored center, zoom level and rotation
 * in the store whenever the user finished moving the map. When the map view
 * is not visible, the Redux store is the source of the truth. When the map view
 * is mounted for the first time, it is initialized from the state of the store.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

import { normalizeAngle } from '~/utils/geography';

/**
 * The state of the origin (home position) and the global flat Earth coordinate
 * system of the map.
 *
 * The flat Earth coordinate system is at the given position and its zero
 * degree heading points towards the heading given in the `angle` property.
 */
const defaultState = {
  position: [18.915125, 47.486305], // Sensible default: Farkashegy Airfield
  angle: '0',
  zoom: 17,
};

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions(
  {
    UPDATE_MAP_VIEW_SETTINGS: (state, action) =>
      u(
        {
          position: action.payload.position,
          angle: normalizeAngle(action.payload.angle),
          zoom: Math.max(Math.min(action.payload.zoom, 20), 0),
        },
        state
      ),
  },
  defaultState
);

export default reducer;
