/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import xor from 'lodash-es/xor';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { removeMissionItemsByIds } from '~/features/mission/slice';
import {
  featureIdToGlobalId,
  missionItemIdToGlobalId,
} from '~/model/identifiers';
import { type Identifier } from '~/utils/collections';

import { findAllUAVFeatures, updateSelection } from './utils';

type MapSelectionSliceState = {
  ids: Identifier[];
};

const initialState: MapSelectionSliceState = { ids: [] };

const { actions, reducer } = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    addToSelection(state, action: PayloadAction<string[]>) {
      state.ids = updateSelection(state.ids, action.payload);
    },

    clearSelection(state) {
      state.ids.length = 0;
    },

    removeFromSelection(state, action: PayloadAction<string[]>) {
      state.ids = updateSelection(state.ids, [], action.payload);
    },

    selectAllUAVs(state) {
      state.ids = updateSelection([], findAllUAVFeatures());
    },

    setSelection(state, action: PayloadAction<string[]>) {
      state.ids = updateSelection([], action.payload);
    },

    toggleInSelection(state, action: PayloadAction<string[]>) {
      state.ids = updateSelection([], xor(state.ids, action.payload));
    },
  },

  extraReducers(builder) {
    builder.addCase(removeFeaturesByIds, (state, action) => {
      state.ids = updateSelection(
        state.ids,
        [],
        action.payload.map(featureIdToGlobalId).filter(Boolean)
      );
    });

    builder.addCase(removeMissionItemsByIds, (state, action) => {
      state.ids = updateSelection(
        state.ids,
        [],
        action.payload.map(missionItemIdToGlobalId).filter(Boolean)
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
