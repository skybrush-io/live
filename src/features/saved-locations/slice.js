/**
 * @file Slice of the state object that handles the state of saved locations.
 *
 * The location list includes the current location that can be saved and any
 * other location that the user has saved earlier.
 */

import pull from 'lodash-es/pull';
import { createSlice } from '@reduxjs/toolkit';

import {
  addItemToFront,
  createNewItemInFrontOf,
  replaceItemOrAddToFront
} from '~/utils/collections';

const { actions, reducer } = createSlice({
  name: 'savedLocations',

  initialState: {
    // byId is a map from saved location ID to the location itself
    byId: {
      fahegy: {
        id: 'fahegy',
        name: 'Farkashegy Airfield',
        center: {
          lon: 18.915125,
          lat: 47.486305
        },
        rotation: 59,
        zoom: 17
      },
      elte: {
        id: 'elte',
        name: 'ELTE Garden',
        center: {
          lon: 19.061951,
          lat: 47.47334
        },
        rotation: 0,
        zoom: 17
      }
    },

    // Order defines the preferred ordering of locations on the UI
    order: ['fahegy', 'elte']
  },

  reducers: {
    addSavedLocation(state, action) {
      return addItemToFront(state, action.payload);
    },

    createNewSavedLocation(state, action) {
      return createNewItemInFrontOf(state, action);
    },

    deleteSavedLocation(state, action) {
      const currentLocationId = action.payload;

      delete state.byId[currentLocationId];
      pull(state.order, currentLocationId);
    },

    updateSavedLocation(state, action) {
      return replaceItemOrAddToFront(state, action.payload);
    }
  }
});

export const {
  addSavedLocation,
  createNewSavedLocation,
  deleteSavedLocation,
  updateSavedLocation
} = actions;

export default reducer;
