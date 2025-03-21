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
import { type Coordinate2D } from '~/utils/math';

export type SubgridConfig = {
  xCount: number;
  yCount: number;
  linkCount: boolean;
  xSpace: number;
  ySpace: number;
  linkSpace: boolean;
};

export type TakeoffGridProperties = {
  subgrids: SubgridConfig[];
};

export type MapToolsSliceState = {
  selectedTool: Tool;
  takeoffGridProperties: TakeoffGridProperties;
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
    takeoffGridProperties.subgrids.reduce<{
      coordinates: Coordinate2D[];
      size: { x: number; y: number };
    }>(
      (unit, grid) => ({
        coordinates: Array.from({ length: grid.yCount }, (_, i) =>
          Array.from({ length: grid.xCount }, (_, j) =>
            unit.coordinates.map<Coordinate2D>(([x, y]) => [
              x + j * (grid.xSpace + unit.size.x),
              y + i * (grid.ySpace + unit.size.y),
            ])
          ).flat()
        ).flat(),
        size: {
          x: grid.xCount * unit.size.x + (grid.xCount - 1) * grid.xSpace,
          y: grid.yCount * unit.size.y + (grid.yCount - 1) * grid.ySpace,
        },
      }),
      { coordinates: [[0, 0]], size: { x: 0, y: 0 } }
    )
);

export const getCenteredTakeoffGrid = createSelector(
  getTakeoffGrid,
  ({ coordinates, size }) => ({
    coordinates: coordinates.map(([dx, dy]) => [
      dx - size.x / 2,
      dy - size.y / 2,
    ]),
    size,
  })
);

export default reducer;
