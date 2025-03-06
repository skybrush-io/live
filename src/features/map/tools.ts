/**
 * @file Reducer function for handling the selected tool on the map.
 */

import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import { Tool } from '~/views/map/tools';
import { type AppSelector } from '~/store/reducers';

type MapToolsSliceState = {
  selectedTool: Tool;
  takeoffGridProperties: {
    subgrids: Array<{
      xCount: number;
      yCount: number;
      linkCount: boolean;
      xSpace: number;
      ySpace: number;
      linkSpace: boolean;
    }>;
  };
};

/**
 * The default selected tool.
 */
const initialState: MapToolsSliceState = {
  selectedTool: Tool.SELECT,
  takeoffGridProperties: { subgrids: [] },
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
    setTakeoffGridProperties(
      state,
      action: PayloadAction<MapToolsSliceState['takeoffGridProperties']>
    ) {
      state.takeoffGridProperties = action.payload;
    },
  },
});

export const { setSelectedTool, setTakeoffGridProperties } = actions;

export const getSelectedTool: AppSelector<Tool> = (state) =>
  state.map.tools.selectedTool;

export const getTakeoffGridProperties: AppSelector<
  MapToolsSliceState['takeoffGridProperties']
> = (state) => state.map.tools.takeoffGridProperties;

export const getTakeoffGrid = createSelector(
  getTakeoffGridProperties,
  (takeoffGridProperties) =>
    takeoffGridProperties.subgrids.reduce(
      (unit, grid) => ({
        size: {
          x: grid.xCount * unit.size.x + (grid.xCount - 1) * grid.xSpace,
          y: grid.yCount * unit.size.y + (grid.yCount - 1) * grid.ySpace,
        },
        coordinates: Array.from({ length: grid.yCount }, (_, i) =>
          Array.from({ length: grid.xCount }, (_, j) =>
            unit.coordinates.map(([x, y]) => [
              x! + j * (grid.xSpace + unit.size.x), // TODO: Remove bang!
              y! + i * (grid.ySpace + unit.size.y), // TODO: Remove bang!
            ])
          ).flat()
        ).flat(),
      }),
      { size: { x: 0, y: 0 }, coordinates: [[0, 0]] }
    )
);

export default reducer;
