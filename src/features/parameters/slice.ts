/**
 * @file Slice of the state object that stores the state of parameter upload.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  addItemToFront,
  clearOrderedCollection,
  type Collection,
  deleteItemById,
  EMPTY_COLLECTION,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

import { type Parameter } from './types';

type ParametersSliceState = ReadonlyDeep<{
  manifest: Collection<Parameter>;
  rebootAfterUpload: boolean;
  dialog: {
    open: boolean;
  };
}>;

const initialState: ParametersSliceState = {
  manifest: EMPTY_COLLECTION,
  rebootAfterUpload: false,
  dialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'parameters',
  initialState,
  reducers: {
    clearManifest: noPayload<ParametersSliceState>((state) => {
      clearOrderedCollection(state.manifest);
    }),

    closeParameterUploadSetupDialog: noPayload<ParametersSliceState>(
      (state) => {
        state.dialog.open = false;
      }
    ),

    removeParameterFromManifest(state, action: PayloadAction<Parameter['id']>) {
      const { payload } = action;
      const { manifest } = state;

      if (payload && typeof payload === 'string') {
        deleteItemById(manifest, payload);
      }
    },

    setRebootAfterUpload(state, action: PayloadAction<boolean>) {
      state.rebootAfterUpload = Boolean(action.payload);
    },

    showParameterUploadSetupDialog: noPayload<ParametersSliceState>((state) => {
      state.dialog.open = true;
    }),

    updateParametersInManifest(
      state,
      action: PayloadAction<Array<Omit<Parameter, 'id'>>>
    ) {
      const { payload } = action;
      const { manifest } = state;

      if (Array.isArray(payload)) {
        for (const { name, value } of payload) {
          if (manifest.order.includes(name)) {
            deleteItemById(manifest, name);
          }

          addItemToFront(manifest, { id: name, name, value });
        }
      }
    },
  },
});

export const {
  clearManifest,
  closeParameterUploadSetupDialog,
  removeParameterFromManifest,
  setRebootAfterUpload,
  showParameterUploadSetupDialog,
  updateParametersInManifest,
} = actions;

export default reducer;
