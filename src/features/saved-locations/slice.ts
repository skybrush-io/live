/**
 * @file Slice of the state object that handles the state of saved locations.
 *
 * The location list includes the current location that can be saved and any
 * other location that the user has saved earlier.
 */

import {
  type AnyAction,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  addItemToFront,
  type Collection,
  createNewItemInFrontOf,
  deleteItemById,
  replaceItemOrAddToFront,
} from '~/utils/collections';

import { type SavedLocation } from './types';

type SavedLocationsSliceState = ReadonlyDeep<Collection<SavedLocation>>;

const initialState: SavedLocationsSliceState = {
  // byId is a map from saved location ID to the location itself
  byId: {
    fahegy: {
      id: 'fahegy',
      name: 'Farkashegy Airfield',
      center: {
        lon: 18.915125,
        lat: 47.486305,
      },
      rotation: 59,
      zoom: 17,
      notes: '',
    },
    elte: {
      id: 'elte',
      name: 'ELTE Garden',
      center: {
        lon: 19.061951,
        lat: 47.47334,
      },
      rotation: 0,
      zoom: 17,
      notes: '',
    },
  },

  // Order defines the preferred ordering of locations on the UI
  order: ['fahegy', 'elte'],
};

const { actions, reducer } = createSlice({
  name: 'savedLocations',
  initialState,
  reducers: {
    addSavedLocation(state, action: PayloadAction<SavedLocation>) {
      addItemToFront(state, action.payload);
    },

    createNewSavedLocation(state, action: AnyAction) {
      // NOTE: The action is used to retrieve the id of the newly created item.
      createNewItemInFrontOf(state, action);
    },

    deleteSavedLocation(state, action: PayloadAction<SavedLocation['id']>) {
      deleteItemById(state, action.payload);
    },

    updateSavedLocation(state, action: PayloadAction<SavedLocation>) {
      replaceItemOrAddToFront(state, action.payload);
    },
  },
});

export { reducer as default, actions };
