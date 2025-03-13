/**
 * @file Redux slice for the site survey dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SwarmSpecification } from '@skybrush/show-format';
import xor from 'lodash-es/xor';

import { updateSelection as updateSelectedIds } from '~/features/map/utils';
import { Identifier } from '~/utils/collections';

export type SiteSurveyState = {
  open: boolean;
  swarm?: SwarmSpecification;
  selection: Identifier[];
};

const initialState: SiteSurveyState = {
  open: false,
  swarm: undefined, // Just to be explicit.
  selection: [],
};

const { reducer, actions } = createSlice({
  name: 'site-survey',
  initialState,
  reducers: {
    // -- Dialog

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

    // -- Selection

    updateSelection(
      state,
      action: PayloadAction<{
        mode: 'add' | 'clear' | 'remove' | 'set' | 'toggle';
        ids: Identifier[];
      }>
    ) {
      const { mode, ids } = action.payload;
      if (mode === 'add') {
        state.selection = updateSelectedIds(state.selection, ids);
      } else if (mode === 'clear') {
        state.selection = [];
      } else if (mode === 'remove') {
        state.selection = updateSelectedIds(state.selection, [], ids);
      } else if (mode === 'set') {
        state.selection = updateSelectedIds([], ids);
      } else if (mode === 'toggle') {
        state.selection = updateSelectedIds([], xor(state.selection, ids));
      }
    },
    // -- Intitialization

    /**
     * Initializes the dialog with the given data.
     */
    initializeWithData(state, action: PayloadAction<SwarmSpecification>) {
      state.swarm = action.payload;
    },
  },
});

export const { closeDialog, initializeWithData, showDialog, updateSelection } =
  actions;

export default reducer;
