/**
 * @file Slice of the state object that stores the state of parameter upload.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Identifier } from '~/utils/collections';
import {
  addItemToBack,
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

  /**
   * The UAVs that the parameters in the manifest should be uploaded to, or
   * `undefined` if the upload is not restricted to specific UAVs.
   */
  targets?: Identifier[];

  dialog: {
    open: boolean;
  };
};

/**
 * Adds the given parameters to the manifest, replacing existing parameters
 * with the same name and UAV ID.
 */
function addParametersToManifest(
  manifest: Collection<Parameter>,
  parameters: ParameterData[]
): void {
  for (const { name, uavId, value } of parameters) {
    const id = uavId === undefined ? name : `${uavId}=${name}`;
    if (manifest.order.includes(id)) {
      deleteItemById(manifest, id);
    }

    addItemToBack(manifest, {
      id,
      name,
      uavId,
      value,
    });
  }
}

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
      state.targets = undefined;
    }),

    clearParameterUploadTargets: noPayload<ParametersSliceState>((state) => {
      state.targets = undefined;
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

      // The UAV restriction belongs to the manifest, so it goes with it
      if (manifest.order.length === 0) {
        state.targets = undefined;
      }
    },

    replaceManifest(
      state,
      action: PayloadAction<{ items: ParameterData[]; targets?: Identifier[] }>
    ) {
      const { items, targets } = action.payload;
      clearOrderedCollection(state.manifest);
      addParametersToManifest(state.manifest, items);
      state.targets =
        targets && targets.length > 0 ? [...targets].sort() : undefined;
    },

    setRebootAfterUpload(state, action: PayloadAction<boolean>) {
      state.rebootAfterUpload = Boolean(action.payload);
    },

    showParameterUploadSetupDialog: noPayload<ParametersSliceState>((state) => {
      state.dialog.open = true;
    }),

    updateParametersInManifest(state, action: PayloadAction<ParameterData[]>) {
      const { payload } = action;

      if (Array.isArray(payload)) {
        addParametersToManifest(state.manifest, payload);
      }
    },
  },
});

export const {
  clearManifest,
  clearParameterUploadTargets,
  closeParameterUploadSetupDialog,
  removeParameterFromManifest,
  replaceManifest,
  setRebootAfterUpload,
  showParameterUploadSetupDialog,
  updateParametersInManifest,
} = actions;

export default reducer;
