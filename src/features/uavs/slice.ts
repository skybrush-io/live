/**
 * @file Slice of the state object that handles the state of the UAVs.
 *
 * This is periodically synchronized with the 'flock' object that gets updated
 * more frequently (at the expense of not being integrated into Redux).
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  addItemSorted,
  clearOrderedCollection,
  type Collection,
  deleteItemsByIds,
  EMPTY_COLLECTION,
  ensureNaturalSortOrder,
  replaceItemOrAddSorted,
} from '~/utils/collections';

import { type StoredUAV } from './types';

type UAVsSliceState = ReadonlyDeep<Collection<StoredUAV>>;

/**
 * The order of the collecitons defines the preferred ordering of
 * UAVs on the UI. Currently we sort automatically based on IDs.
 */
const initialState: UAVsSliceState = EMPTY_COLLECTION;

const { actions, reducer } = createSlice({
  name: 'uavs',
  initialState,
  reducers: {
    addUAVs(state, action: PayloadAction<Record<StoredUAV['id'], StoredUAV>>) {
      for (const uav of Object.values(action.payload)) {
        addItemSorted(state, uav);
      }

      ensureNaturalSortOrder(state);
    },

    clearUAVList(state) {
      clearOrderedCollection<StoredUAV>(state);
    },

    _removeUAVsByIds(state, action: PayloadAction<Array<StoredUAV['id']>>) {
      // Do not call this reducer directly from anywhere except in reaction to
      // events dispatched from the global flock object. This is to ensure that
      // there is only a single source of truth for the list of UAVs; calling
      // this reducer directly would result in some UAVs being present in the
      // flock but not here
      deleteItemsByIds(state, action.payload);
    },

    updateAgesOfUAVs(
      state,
      action: PayloadAction<Record<StoredUAV['id'], StoredUAV['age']>>
    ) {
      for (const [uavId, age] of Object.entries(action.payload)) {
        const uav = uavId ? state.byId[uavId] : undefined;
        if (uav) {
          uav.age = age;
        }
      }
    },

    updateUAVs(
      state,
      action: PayloadAction<Record<StoredUAV['id'], StoredUAV>>
    ) {
      for (const uav of Object.values(action.payload)) {
        replaceItemOrAddSorted(state, uav);
      }
    },
  },
});

export const {
  addUAVs,
  clearUAVList,
  updateAgesOfUAVs,
  updateUAVs,
  _removeUAVsByIds,
} = actions;

export default reducer;
