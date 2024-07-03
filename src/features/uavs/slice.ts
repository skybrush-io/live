/**
 * @file Slice of the state object that handles the state of the UAVs.
 *
 * This is periodically synchronized with the 'flock' object that gets updated
 * more frequently (at the expense of not being integrated into Redux).
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { setSelection } from '~/features/map/selection';
import { globalIdToUavId, isUavId } from '~/model/identifiers';
import {
  addItemSorted,
  clearOrderedCollection,
  type Collection,
  deleteItemsByIds,
  EMPTY_COLLECTION,
  ensureNaturalSortOrder,
  replaceItemOrAddSorted,
} from '~/utils/collections';

import { UAVDetailsPanelTab, type StoredUAV } from './types';

type UAVsSliceState = Collection<StoredUAV> & {
  panel: {
    followMapSelection: boolean;
    selectedTab: UAVDetailsPanelTab;
    selectedUAVId?: StoredUAV['id'];
  };
};

/**
 * The order of the collecitons defines the preferred ordering of
 * UAVs on the UI. Currently we sort automatically based on IDs.
 */
const initialState: UAVsSliceState = {
  ...EMPTY_COLLECTION,
  panel: {
    followMapSelection: true,
    selectedTab: UAVDetailsPanelTab.PREFLIGHT,
    selectedUAVId: undefined,
  },
};

const { actions, reducer } = createSlice({
  name: 'uavs',
  initialState,
  reducers: {
    addUAVs(state, action: PayloadAction<Record<StoredUAV['id'], StoredUAV>>) {
      for (const uav of Object.values(action.payload)) {
        addItemSorted(state, uav);
      }

      ensureNaturalSortOrder(state);
    },

    clearUAVList(state) {
      clearOrderedCollection<StoredUAV>(state);
    },

    _removeUAVsByIds(state, action: PayloadAction<Array<StoredUAV['id']>>) {
      // Do not call this reducer directly from anywhere except in reaction to
      // events dispatched from the global flock object. This is to ensure that
      // there is only a single source of truth for the list of UAVs; calling
      // this reducer directly would result in some UAVs being present in the
      // flock but not here
      deleteItemsByIds(state, action.payload);
    },

    setSelectedTabInUAVDetailsPanel(
      state,
      { payload }: PayloadAction<UAVDetailsPanelTab>
    ) {
      state.panel.selectedTab = payload;
    },

    setSelectedUAVIdInUAVDetailsPanel(
      state,
      { payload }: PayloadAction<StoredUAV['id']>
    ) {
      state.panel.selectedUAVId = payload;
    },

    toggleFollowMapSelectionInUAVDetailsPanel: {
      prepare: () => ({ payload: null }),
      reducer(state) {
        state.panel.followMapSelection = !state.panel.followMapSelection;
      },
    },

    updateAgesOfUAVs(
      state,
      action: PayloadAction<Record<StoredUAV['id'], StoredUAV['age']>>
    ) {
      for (const [uavId, age] of Object.entries(action.payload)) {
        const uav = uavId ? state.byId[uavId] : undefined;
        if (uav) {
          uav.age = age;
        }
      }
    },

    updateUAVs(
      state,
      action: PayloadAction<Record<StoredUAV['id'], StoredUAV>>
    ) {
      for (const uav of Object.values(action.payload)) {
        replaceItemOrAddSorted(state, uav);
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(setSelection, (state, { payload: selection }) => {
      if (state.panel.followMapSelection) {
        const selectedUAVs = selection.filter(isUavId);
        if (selectedUAVs.length > 0) {
          state.panel.selectedUAVId = globalIdToUavId(selectedUAVs[0]!);
        }
      }
    });
  },
});

export const {
  addUAVs,
  clearUAVList,
  setSelectedTabInUAVDetailsPanel,
  setSelectedUAVIdInUAVDetailsPanel,
  toggleFollowMapSelectionInUAVDetailsPanel,
  updateAgesOfUAVs,
  updateUAVs,
  _removeUAVsByIds,
} = actions;

export default reducer;
