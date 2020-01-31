/**
 * @file Slice of the state object that handles the state of the current
 * mission, i.e. a set of trajectories and commands that a group of UAVs must
 * perform, as well as a mapping from the mission-specific identifiers of
 * the UAVs to the real, physicaly identifiers of the UAVs that participate
 * in the mission.
 */

import { createSlice } from '@reduxjs/toolkit';

const { reducer } = createSlice({
  name: 'mission',

  initialState: {
    // Stores a mapping from the mission-specific consecutive identifiers
    // to the IDs of the UAVs that participate in the mission with that
    // mission-specific identifier. The mapping may store UAV IDs and
    // undefined values for identifiers where the corresponding physical UAV
    // is not assigned yet.
    mapping: ['03', undefined, '01', '02', undefined]
  },

  reducers: {}
});

// export const { addUAVs, clearUAVList, removeUAVs, updateUAVs } = actions;

export default reducer;
