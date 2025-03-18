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

import config from 'config';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type LonLat, normalizeAngle } from '~/utils/geography';

import { type View } from './types';

/**
 * The state of the origin (home position) and the global flat Earth coordinate
 * system of the map.
 *
 * The flat Earth coordinate system is at the given position and its zero
 * degree heading points towards the heading given in the `angle` property.
 */
type MapViewSliceState = View;

const initialState: MapViewSliceState = config.map.view;

const { actions, reducer } = createSlice({
  name: 'map/view',
  initialState,
  reducers: {
    updateMapViewSettings(
      state,
      action: PayloadAction<{
        position: LonLat;
        angle: number;
        zoom: number;
      }>
    ) {
      const { angle, position, zoom } = action.payload;
      state.position = position;
      state.angle = normalizeAngle(angle);
      state.zoom = Math.max(Math.min(zoom, 20), 0);
    },
  },
});

export const { updateMapViewSettings } = actions;

export default reducer;
