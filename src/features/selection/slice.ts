/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import xor from 'lodash-es/xor';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { removeMissionItemsByIds } from '~/features/mission/slice';
import i18n from '~/i18n';
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
  firstUnusedNumericId,
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

    deleteGroup(state, action: PayloadAction<Identifier>) {
      deleteItemById(state.groups, action.payload);
    },

    saveCurrentSelectionAsGroup(
      state,
      action: PayloadAction<Identifier | undefined>
    ) {
      const selectedIds = state.ids;
      if (selectedIds.length === 0) {
        return;
      }

      const id = action.payload ?? firstUnusedNumericId(state.groups);
      const group = getItemById(state.groups, id);
      if (group !== undefined) {
        group.ids = selectedIds;
      } else {
        const name = i18n.t('selectionGroups.newGroupNameTemplate', { id });
        addItemSorted(state.groups, { id, name, ids: selectedIds });
        ensureNaturalSortOrder(state.groups);
      }
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
  saveCurrentSelectionAsGroup,
} = actions;

export default reducer;
