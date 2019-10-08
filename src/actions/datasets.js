/**
 * @file Action factories related to the management of features on the map.
 */

import { createAction } from 'redux-actions';
import { ADD_DATASET, REMOVE_DATASETS } from './types';

/**
 * Action factory that creates an action that adds a new dataset to the state.
 *
 * @param {Object}  title  the title of the dataset to add
 */
export const addDataset = createAction(ADD_DATASET, title => ({ title }));

/**
 * Action factory that creates an action that removes a dataset from the state.
 *
 * @param {string}  id  the ID of the dataset to remove
 */
export const removeDataset = createAction(REMOVE_DATASETS, id => ({
  ids: [id]
}));
