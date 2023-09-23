/**
 * @file Slice of the state object that stores the last known states of the
 * docking stations.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { notifyObjectsDeletedOnServer } from '~/features/objects/actions';
import {
  clearOrderedCollection,
  type Collection,
  EMPTY_COLLECTION,
  maybeDeleteItemsByIds,
} from '~/utils/collections';

import { type DockState } from './types';
import { updateStateOfDock } from './utils';

export type DocksSliceState = ReadonlyDeep<Collection<DockState>>;

const initialState: DocksSliceState = EMPTY_COLLECTION;

const { actions, reducer } = createSlice({
  name: 'docks',
  initialState,
  reducers: {
    /**
     * Clears the dock list.
     */
    clearDockList(state) {
      clearOrderedCollection<DockState>(state);
    },

    /**
     * Updates the state of a single dock, creating the dock if it does not
     * exist yet.
     */
    setDockState(
      state,
      { payload: { id, ...rest } }: PayloadAction<DockState>
    ) {
      updateStateOfDock(state, id, rest);
    },

    /**
     * Updates the state of multiple docks, creating the docks that do not
     * exist yet.
     */
    setDockStateMultiple(
      state,
      { payload }: PayloadAction<Record<DockState['id'], Omit<DockState, 'id'>>>
    ) {
      for (const [id, dock] of Object.entries(payload)) {
        updateStateOfDock(state, id, dock);
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(notifyObjectsDeletedOnServer, (state, action) => {
      maybeDeleteItemsByIds(state, action.payload);
    });
  },
});

export const { clearDockList, setDockState, setDockStateMultiple } = actions;

export default reducer;
