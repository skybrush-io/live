/**
 * @file Slice of the state object that handles the tabular datasets loaded
 * by the user.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type Collection, deleteItemsByIds } from '~/utils/collections';

import { type Dataset } from './types';

type DatasetsSliceState = Collection<Dataset>;

const initialState: DatasetsSliceState = { byId: {}, order: [] };

const { actions, reducer } = createSlice({
  name: 'datasets',
  initialState,
  reducers: {
    removeDatasets(state, action: PayloadAction<Array<Dataset['id']>>) {
      deleteItemsByIds(state, action.payload);
    },
  },
});

export const { removeDatasets } = actions;

export default reducer;
