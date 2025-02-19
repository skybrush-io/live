/**
 * @file Redux slice for the site survey dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SwarmSpecification } from '@skybrush/show-format';

export type SiteSurveyState = {
  open: boolean;
  swarm?: SwarmSpecification;
};

const initialState: SiteSurveyState = {
  open: false,
  swarm: undefined, // Just to be explicit.
};

const { reducer, actions } = createSlice({
  name: 'site-survey',
  initialState,
  reducers: {
    /**
     * Opens the dialog.
     *
     * The dialog must always be explicitly initialized with the desired
     * data by the user after it is opened.
     */
    showDialog(state) {
      state.open = true;
    },

    /**
     * Closes the dialog and completely resets its state.
     *
     * The dialog must always be explicitly initialized with the desired
     * data by the user after it is opened.
     */
    closeDialog() {
      // Not only close the dialog, but also reset all the stored data.
      // The dialog should always be explicitly initialized by the user
      // after it is opened.
      return initialState;
    },

    /**
     * Initializes the dialog with the given data.
     */
    initializeWithData(state, action: PayloadAction<SwarmSpecification>) {
      state.swarm = action.payload;
    },
  },
});

export const { closeDialog, showDialog, initializeWithData } = actions;

export default reducer;
