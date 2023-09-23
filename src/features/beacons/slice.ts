/**
 * @file Slice of the state object that stores the last known states of the
 * beacons from the server.
 */

import { createSlice, type Draft, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { notifyObjectsDeletedOnServer } from '~/features/objects/actions';
import {
  clearOrderedCollection,
  type Collection,
  EMPTY_COLLECTION,
  maybeDeleteItemsByIds,
} from '~/utils/collections';

import { type Beacon } from './types';
import { updateStateOfBeacon } from './utils';

export type BeaconsSliceState = ReadonlyDeep<Collection<Beacon>>;

const initialState: BeaconsSliceState = EMPTY_COLLECTION;

const { actions, reducer } = createSlice({
  name: 'beacons',
  initialState,
  reducers: {
    /**
     * Clears the beacon list.
     */
    clearBeaconList(state) {
      clearOrderedCollection<Beacon>(state);
    },

    /**
     * Updates the state of a single beacon, creating the beacon if it does not
     * exist yet.
     */
    setBeaconState(state, { payload: { id, ...rest } }: PayloadAction<Beacon>) {
      updateStateOfBeacon(state, id, rest);
    },

    /**
     * Updates the state of multiple beacons, creating the beacons that do not
     * exist yet.
     */
    setBeaconStateMultiple(
      state,
      { payload }: PayloadAction<Record<Beacon['id'], Omit<Beacon, 'id'>>>
    ) {
      for (const [id, beacon] of Object.entries(payload)) {
        updateStateOfBeacon(state, id, beacon);
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(notifyObjectsDeletedOnServer, (state, action) => {
      maybeDeleteItemsByIds(state, action.payload);
    });
  },
});

export const { clearBeaconList, setBeaconState, setBeaconStateMultiple } =
  actions;

export default reducer;
