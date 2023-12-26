/**
 * @file Slice of the state object that handles the tabular datasets loaded
 * by the user.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  type Collection,
  deleteItemsByIds,
  EMPTY_COLLECTION,
} from '~/utils/collections';

import { type Dataset } from './types';

type DatasetsSliceState = ReadonlyDeep<Collection<Dataset>>;

const initialState: DatasetsSliceState = EMPTY_COLLECTION;

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
