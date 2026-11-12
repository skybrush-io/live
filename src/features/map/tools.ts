import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { isEditingTool, Tool } from '~/components/map/tools';
import { type AppSelector } from '~/store/reducers';

type MapToolsSliceState = {
  locked: boolean;
  selectedTool: Tool;
};

const initialState: MapToolsSliceState = {
  locked: false,
  selectedTool: Tool.SELECT,
};

const { reducer, actions } = createSlice({
  name: 'map/tools',
  initialState,
  reducers: {
    setSelectedTool(state, action: PayloadAction<Tool>) {
      if (!(state.locked && isEditingTool(action.payload))) {
        state.selectedTool = action.payload;
      }
    },

    toggleMapLock(state) {
      state.locked = !state.locked;
      if (state.locked && isEditingTool(state.selectedTool)) {
        state.selectedTool = Tool.SELECT;
      }
    },
  },
});

export const { setSelectedTool, toggleMapLock } = actions;

export const getSelectedTool: AppSelector<Tool> = (state) =>
  state.map.tools.selectedTool;

export const isMapLocked: AppSelector<boolean> = (state) =>
  state.map.tools.locked;

export default reducer;
