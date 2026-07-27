import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  addItemToFront,
  clearOrderedCollection,
  createCollectionFromArray,
  deleteItemById,
  type Collection,
  type Identifier,
  type ItemLike,
} from '~/utils/collections';

export type ConsistencyCheckParameterNameItem = ItemLike & {
  name: string;
};

const DEFAULT_PARAMETER_NAMES = [
  'SHOW_ORIGIN_AMSL',
  'SHOW_ORIGIN_LAT',
  'SHOW_ORIGIN_LNG',
  'SHOW_ORIENTATION',
];

type ConsistencyCheckSliceState = {
  parameterNames: Collection<ConsistencyCheckParameterNameItem>;
  dialog: {
    open: boolean;
  };
};

const initialState: ConsistencyCheckSliceState = {
  parameterNames: createCollectionFromArray(
    DEFAULT_PARAMETER_NAMES.map(
      (name): ConsistencyCheckParameterNameItem => ({
        id: name,
        name,
      })
    )
  ),
  dialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'consistencyCheck',
  initialState,
  reducers: {
    clearConsistencyCheckParameterNames(state) {
      clearOrderedCollection(state.parameterNames);
    },

    closeConsistencyCheckSetupDialog(state) {
      state.dialog.open = false;
    },

    removeParameterNameFromConsistencyCheckList(
      state,
      action: PayloadAction<Identifier>
    ) {
      const { payload } = action;
      const { parameterNames } = state;

      if (payload && typeof payload === 'string') {
        deleteItemById(parameterNames, payload);
      }
    },

    setConsistencyCheckParameterNames(
      state,
      action: PayloadAction<Identifier[]>
    ) {
      const { payload } = action;
      const { parameterNames } = state;

      clearOrderedCollection(parameterNames);

      // Dedup case-sensitively, preserving order (first occurrence wins).
      const seen = new Set<Identifier>();
      const unique: Identifier[] = [];
      for (const name of payload) {
        if (typeof name === 'string' && name.length > 0 && !seen.has(name)) {
          seen.add(name);
          unique.push(name);
        }
      }

      // Add in reverse so that addItemToFront yields the original order.
      for (let i = unique.length - 1; i >= 0; i--) {
        const name = unique[i];
        addItemToFront(parameterNames, { id: name, name });
      }
    },

    showConsistencyCheckSetupDialog(state) {
      state.dialog.open = true;
    },
  },
});

export const {
  clearConsistencyCheckParameterNames,
  closeConsistencyCheckSetupDialog,
  removeParameterNameFromConsistencyCheckList,
  setConsistencyCheckParameterNames,
  showConsistencyCheckSetupDialog,
} = actions;

export default reducer;
