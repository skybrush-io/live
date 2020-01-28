/**
 * @file Slice of the state object that handles the tabular datasets loaded
 * by the user.
 */

import { createSlice } from '@reduxjs/toolkit';

import { deleteItemsByIds } from '~/utils/collections';

const { actions, reducer } = createSlice({
  name: 'datasets',

  initialState: {
    // byId is a map from dataset ID to the dataset itself
    byId: {
      // No datasets are added by default. Here's how an example item should
      // look like:
      // {
      //     id: 123,
      //     meta: {
      //         title: 'Example dataset',
      //         columns: ['columnId1', 'columnId2', ...]
      //     },
      //     data: {
      //         columnId1: {
      //             values: [123, 456, ...],
      //             title: 'Column title'
      //         },
      //         ...
      //     }
      // }
    },
    // Order defines the preferred ordering of datasets on the UI
    order: []
  },

  reducers: {
    removeDatasets(state, action) {
      return deleteItemsByIds(state, action.payload);
    }
  }
});

export const { removeDatasets } = actions;

export default reducer;
