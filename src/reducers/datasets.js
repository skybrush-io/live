/**
 * @file Reducer function for handling the part of the state object that
 * stores the tabular datasets loaded by the user.
 */

import { handleActions } from 'redux-actions';

import { deleteByIds } from '~/utils/collections';

/**
 * Default content of the dataset registry in the state object.
 */
const defaultState = {
  // Items is a map from dataset ID to the dataset itself
  items: {
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
};

/**
 * The reducer function that handles actions related to the datasets.
 */
const reducer = handleActions(
  {
    REMOVE_DATASETS(state, action) {
      const { ids } = action.payload;
      return deleteByIds(ids, state);
    }
  },
  defaultState
);

export default reducer;
