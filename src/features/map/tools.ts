/**
 * @file Reducer function for handling the selected tool on the map.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { Tool } from '~/views/map/tools';
import { type AppSelector } from '~/store/reducers';

type MapToolsSliceState = {
  selectedTool: Tool;
  takeoffGridProperties: unknown;
};

/**
 * The default selected tool.
 */
const initialState: MapToolsSliceState = {
  selectedTool: Tool.SELECT,
  takeoffGridProperties: {},
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
    setTakeoffGridProperties(state, action: PayloadAction<unknown>) {
      state.takeoffGridProperties = action.payload;
    },
  },
});

export const { setSelectedTool, setTakeoffGridProperties } = actions;

export const getSelectedTool: AppSelector<Tool> = (state) =>
  state.map.tools.selectedTool;

export const getTakeoffGridProperties: AppSelector<unknown> = (state) =>
  state.map.tools.takeoffGridProperties;

export default reducer;
