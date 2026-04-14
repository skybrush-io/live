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
import {
  addItemSorted,
  type Collection,
  deleteItemById,
  EMPTY_COLLECTION,
  ensureNaturalSortOrder,
  getItemById,
  type Identifier,
} from '~/utils/collections';

import type { SelectionGroup, SelectionGroupData } from './types';
import { findAllUAVFeatures, updateSelection } from './utils';

type MapSelectionSliceState = {
  /**
   * The currently selected IDs.
   */
  ids: Identifier[];

  /**
   * Collection of selection groups, always sorted by ID.
   */
  groups: Collection<SelectionGroup>;
};

const initialState: MapSelectionSliceState = {
  ids: [],
  groups: EMPTY_COLLECTION,
};

const { actions, reducer } = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    // -- Selection

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

    // -- Groups

    _addGroup(
      state,
      action: PayloadAction<{ id: Identifier; data: SelectionGroupData }>
    ) {
      // precondition: there is no group with the given ID yet; caller must check this
      const { id, data } = action.payload;
      addItemSorted(state.groups, { id, ...data });
      ensureNaturalSortOrder(state.groups);
    },

    deleteGroup(state, action: PayloadAction<Identifier>) {
      deleteItemById(state.groups, action.payload);
    },

    selectGroup(state, action: PayloadAction<Identifier>) {
      const group = getItemById(state.groups, action.payload);
      if (group !== undefined) {
        state.ids = updateSelection([], group.ids);
      }
    },

    updateGroup(
      state,
      action: PayloadAction<{
        id: Identifier;
        data: Partial<SelectionGroupData>;
      }>
    ) {
      const { id, data } = action.payload;
      const group = getItemById(state.groups, id);
      if (group === undefined) {
        return;
      }

      const name = data.name?.trim() ?? '';
      if (name !== '') {
        group.name = name;
      }

      const ids = data.ids;
      if (ids !== undefined && ids.length > 0) {
        group.ids = ids;
      }
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
  deleteGroup,
  removeFromSelection,
  selectAllUAVs,
  selectGroup,
  setSelection,
  toggleInSelection,
  updateGroup,
  _addGroup,
} = actions;

export default reducer;
