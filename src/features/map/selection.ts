/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import xor from 'lodash-es/xor';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { featureIdToGlobalId } from '~/model/identifiers';
import { type Identifier } from '~/utils/collections';

import { findAllUAVFeatures, updateSelection } from './utils';

type MapSelectionSliceState = ReadonlyDeep<Identifier[]>;

const initialState: MapSelectionSliceState = [];

const { actions, reducer } = createSlice({
  name: 'map/selection',
  initialState,
  reducers: {
    addToSelection(state, action: PayloadAction<string[]>) {
      return updateSelection(state, action.payload);
    },

    clearSelection(state) {
      state.length = 0;
    },

    removeFromSelection(state, action: PayloadAction<string[]>) {
      return updateSelection(state, [], action.payload);
    },

    selectAllUAVs() {
      return updateSelection([], findAllUAVFeatures());
    },

    setSelection(_state, action: PayloadAction<string[]>) {
      return updateSelection([], action.payload);
    },

    toggleInSelection(state, action: PayloadAction<string[]>) {
      return updateSelection([], xor(state, action.payload));
    },
  },

  extraReducers(builder) {
    builder.addCase(removeFeaturesByIds, (state, action) => {
      return updateSelection(
        state,
        [],
        action.payload.map(featureIdToGlobalId).filter(Boolean)
      );
    });
  },
});

export const {
  addToSelection,
  clearSelection,
  removeFromSelection,
  selectAllUAVs,
  setSelection,
  toggleInSelection,
} = actions;

export default reducer;
