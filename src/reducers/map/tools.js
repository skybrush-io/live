/**
 * @file Reducer function for handling the selected tool on the map.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * The default selected tool.
 */
const initialState = {
  selectedTool: 'select',
};

/**
 * The reducer function that handles actions related to the tool selection.
 */
const { reducer, actions } = createSlice({
  name: 'map/tools',
  initialState,
  reducers: {
    setSelectedTool(state, action) {
      state.selectedTool = action.payload;
    },
  },
});

export const { setSelectedTool } = actions;

export default reducer;
