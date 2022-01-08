/**
 * @file Slice of the state object that stores the state of the LCD clock panel.
 */

import { createSlice } from '@reduxjs/toolkit';

import {
  addItemToFront,
  clearOrderedCollection,
  deleteItemById,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'parameters',

  initialState: {
    manifest: {
      byId: {},
      order: [],
    },
    dialog: {
      open: false,
    },
  },

  reducers: {
    clearManifest: noPayload((state) => {
      clearOrderedCollection(state.manifest);
    }),

    closeParameterUploadSetupDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    removeParameterFromManifest(state, action) {
      const { payload } = action;
      const { manifest } = state;

      if (payload && typeof payload === 'string') {
        deleteItemById(manifest, payload);
      }
    },

    showParameterUploadSetupDialog: noPayload((state) => {
      state.dialog.open = true;
    }),

    updateParametersInManifest(state, action) {
      const { payload } = action;
      const { manifest } = state;

      if (Array.isArray(payload)) {
        for (const { name, value } of payload) {
          const index = manifest.order.includes(name);
          if (index >= 0) {
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
  showParameterUploadSetupDialog,
  updateParametersInManifest,
} = actions;

export default reducer;
