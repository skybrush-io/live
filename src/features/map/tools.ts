/**
 * @file Reducer function for handling the selected tool on the map.
 */

import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { isUnsafeTool, Tool } from '~/components/map/tools';
import { isMapInSafeMode } from '~/features/safety/selectors';
import { type RootState, type AppSelector } from '~/store/reducers';

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

/**
 * Selector that returns the tool currently in effect on the map. While the
 * map is in safe mode, unsafe tools are reported as the select tool because
 * they cannot be used.
 */
export const getSelectedTool: AppSelector<Tool> = createSelector(
  (state: RootState) => state.map.tools.selectedTool,
  isMapInSafeMode,
  (selectedTool, safeMode) =>
    safeMode && isUnsafeTool(selectedTool) ? Tool.SELECT : selectedTool
);

export default reducer;
