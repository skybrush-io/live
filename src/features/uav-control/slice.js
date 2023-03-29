/**
 * @file Slice of the state object that handles widgets and dialogs related to
 * the direct control of UAVs.
 */

import isNil from 'lodash-es/isNil';
import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'uavControl',

  initialState: {
    flyToTargetDialog: {
      open: false,
      initialValues: {
        coords: '',
        mode: 'relative',
        altitude: 0,
      },
    },
  },

  reducers: {
    closeFlyToTargetDialog: noPayload((state) => {
      state.flyToTargetDialog.open = false;
    }),

    openFlyToTargetDialog(state, action) {
      const { payload = {} } = action;
      const { coords, mode, altitude } = payload;

      state.flyToTargetDialog.initialValues = {
        ...state.flyToTargetDialog.initialValues,
        coords,
        mode: mode || 'ahl',
        altitude: isNil(altitude) ? 10 : altitude,
      };

      state.flyToTargetDialog.open = true;
    },
  },
});

export const { closeFlyToTargetDialog, openFlyToTargetDialog } = actions;

export default reducer;
