/**
 * @file Slice of the state object that handles the state of saved locations.
 *
 * The location list includes the current location that can be saved and any
 * other location that the user has saved earlier.
 */

import config from 'config';

import {
  type AnyAction,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  addItemToFront,
  type Collection,
  createCollectionFromArray,
  createNewItemInFrontOf,
  deleteItemById,
  replaceItemOrAddToFront,
} from '~/utils/collections';

import { type SavedLocation } from './types';

type SavedLocationsSliceState = Collection<SavedLocation>;

const initialState: SavedLocationsSliceState = createCollectionFromArray(
  config.map.locations
);

const { actions, reducer } = createSlice({
  name: 'saved-locations',
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
