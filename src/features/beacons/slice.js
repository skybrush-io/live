/**
 * @file Slice of the state object that stores the last known states of the
 * beacons from the server.
 */

import has from 'lodash-es/has';
import { createSlice } from '@reduxjs/toolkit';

import { notifyObjectsDeletedOnServer } from '~/features/objects/actions';
import {
  clearOrderedCollection,
  maybeDeleteItemsByIds,
} from '~/utils/collections';

/**
 * Function that updates the state of a beacon with the given ID in
 * a state object.
 *
 * @param  {Object} state  the Redux state object to modify
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the beacon
 */
function updateStateOfBeacon(state, id, properties) {
  const { byId } = state;

  if (!has(byId, id)) {
    byId[id] = {
      id,
      position: null,
      heading: null,
      active: false,
    };
    state.order.push(id);
  }

  Object.assign(byId[id], properties);
}

const { actions, reducer } = createSlice({
  name: 'beacons',

  initialState: {
    byId: {
      // No items are added by default. Here's how an example item should
      // look like:
      // {
      //   id: 'BCN:GPS',
      //   position: ...,
      //   heading: 147,
      //   active: true,
      //   name: 'GPS beacon'
      // }
    },
    order: [],
  },

  reducers: {
    /**
     * Clears the beacon list.
     */
    clearBeaconList(state) {
      clearOrderedCollection(state);
    },

    /**
     * Updates the state of a single beacon, creating the beacon if it does not
     * exist yet.
     */
    setBeaconState(state, action) {
      const { id, ...rest } = action.payload;
      updateStateOfBeacon(state, id, rest);
    },

    /**
     * Updates the state of multiple beacons, creating the beacons that do not
     * exist yet.
     */
    setBeaconStateMultiple(state, action) {
      const { payload } = action;
      for (const id of Object.keys(payload)) {
        updateStateOfBeacon(state, id, payload[id]);
      }
    },
  },

  extraReducers: {
    [notifyObjectsDeletedOnServer]: (state, action) => {
      maybeDeleteItemsByIds(state, action.payload);
    },
  },
});

export const { clearBeaconList, setBeaconState, setBeaconStateMultiple } =
  actions;

export default reducer;
