/**
 * @file Slice of the state object that stores the state of parameter upload.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Identifier } from '~/utils/collections';
import {
  addItemToFront,
  clearOrderedCollection,
  type Collection,
  deleteItemById,
  EMPTY_COLLECTION,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

import type { Parameter, ParameterData } from './types';

type ParametersSliceState = {
  manifest: Collection<Parameter>;
  rebootAfterUpload: boolean;
  dialog: {
    open: boolean;
  };
};

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

    removeParameterFromManifest(state, action: PayloadAction<Identifier>) {
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

    updateParametersInManifest(state, action: PayloadAction<ParameterData[]>) {
      const { payload } = action;
      const { manifest } = state;

      if (Array.isArray(payload)) {
        for (const { name, uavId, value } of payload) {
          const id = uavId === undefined ? name : `${uavId}=${name}`;
          if (manifest.order.includes(id)) {
            deleteItemById(manifest, id);
          }

          addItemToFront(manifest, {
            id,
            name,
            uavId,
            value,
          });
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
