/**
 * @file Reducer function for handling the selected tool on the map.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { Tool } from '~/components/map/tools';
import { type AppSelector } from '~/store/reducers';

type MapToolsSliceState = {
  selectedTool: Tool;
};

/**
 * The default selected tool.
 */
const initialState: MapToolsSliceState = {
  selectedTool: Tool.SELECT,
};

/**
 * The reducer function that handles actions related to the tool selection.
 */
const { reducer, actions } = createSlice({
  name: 'map/tools',
  initialState,
  reducers: {
    setSelectedTool(state, action: PayloadAction<Tool>) {
      state.selectedTool = action.payload;
    },
  },
});

export const { setSelectedTool } = actions;

export const getSelectedTool: AppSelector<Tool> = (state) =>
  state.map.tools.selectedTool;

export default reducer;
