import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { DroneSpecification } from '@skybrush/show-format';

import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';

import type { ShowHealingField } from './types';

/**
 * State of the show healing calculation started from the dialog.
 */
export type ShowHealingResult =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; error: string }>
  | Readonly<{
      status: 'ready';
      missionIndex: MissionIndex;
      uavId: Identifier;
      startTime: number;
      spec: DroneSpecification;
    }>;

type ShowHealingDialogSliceState = {
  /** Whether to confirm the result automatically, skipping the review step */
  autoConfirm: boolean;
  /** Text entered into the drone fields of the dialog */
  fields: Record<ShowHealingField, string>;
  open: boolean;
  result: ShowHealingResult;
};

const IDLE_RESULT: ShowHealingResult = { status: 'idle' };

const createEmptyFields = (): Record<ShowHealingField, string> => ({
  slot: '',
  replacement: '',
});

const initialState: ShowHealingDialogSliceState = {
  autoConfirm: false,
  fields: createEmptyFields(),
  open: false,
  result: IDLE_RESULT,
};

const { actions, reducer } = createSlice({
  name: 'show-healing',
  initialState,
  reducers: {
    _setShowHealingResult: (
      state,
      action: PayloadAction<ShowHealingResult>
    ) => {
      state.result = action.payload;
    },

    closeShowHealingDialog: (state) => {
      state.open = false;
      state.result = IDLE_RESULT;
    },

    setShowHealingAutoConfirm: (state, action: PayloadAction<boolean>) => {
      state.autoConfirm = action.payload;
    },

    /**
     * Sets the text of a drone field and discards the previous result as it
     * belongs to the previous drones.
     */
    setShowHealingFieldText: (
      state,
      action: PayloadAction<{ field: ShowHealingField; text: string }>
    ) => {
      state.fields[action.payload.field] = action.payload.text;
      state.result = IDLE_RESULT;
    },

    /**
     * Opens the dialog with empty drone fields.
     */
    showShowHealingDialog: (state) => {
      state.open = true;
      state.fields = createEmptyFields();
      state.result = IDLE_RESULT;
    },
  },
});

export const {
  _setShowHealingResult,
  closeShowHealingDialog,
  setShowHealingAutoConfirm,
  setShowHealingFieldText,
  showShowHealingDialog,
} = actions;

export default reducer;
