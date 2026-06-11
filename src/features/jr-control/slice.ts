/**
 * @file Redux slice for the JR-board control panel (scaffold).
 *
 * Tracks the list of JR boards to manage, their last-known health, and the
 * parameters for the ARM broadcast. Health polling and broadcasting are
 * performed by the Skybrush server's `jr_control` extension via `/api/v1/jr`.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type JRHealth = {
  state?: string;
  pps?: { state?: string; count?: number; ticks_per_sec?: number };
  show?: { loaded?: boolean; frames?: number; fps?: number };
  uptime_ms?: number;
};

export type JRBoardEntry = {
  ip: string;
  /** Last fetched health, or undefined if never polled / unreachable. */
  health?: JRHealth;
  error?: string;
  lastCheckedAt?: number;
};

export type ArmParams = {
  startIn: number;
  fpsNum: number;
  fpsDen: number;
  frameCount: number;
  fileId: number;
  showId: number;
  repeat: number;
};

type JRControlSliceState = {
  boards: JRBoardEntry[];
  arm: ArmParams;
  polling: boolean;
  lastArmSummary?: string;
};

const initialState: JRControlSliceState = {
  boards: [],
  arm: {
    startIn: 5,
    fpsNum: 30,
    fpsDen: 1,
    frameCount: 300,
    fileId: 99,
    showId: 1,
    repeat: 5,
  },
  polling: false,
};

const { actions, reducer } = createSlice({
  name: 'jr-control',
  initialState,
  reducers: {
    addBoard(state, action: PayloadAction<string>) {
      const ip = action.payload.trim();
      if (ip && !state.boards.some((b) => b.ip === ip)) {
        state.boards.push({ ip });
      }
    },
    removeBoard(state, action: PayloadAction<string>) {
      state.boards = state.boards.filter((b) => b.ip !== action.payload);
    },
    setBoardHealth(
      state,
      action: PayloadAction<{ ip: string; health?: JRHealth; error?: string }>
    ) {
      const board = state.boards.find((b) => b.ip === action.payload.ip);
      if (board) {
        board.health = action.payload.health;
        board.error = action.payload.error;
        board.lastCheckedAt = Date.now();
      }
    },
    setArmParams(state, action: PayloadAction<Partial<ArmParams>>) {
      state.arm = { ...state.arm, ...action.payload };
    },
    setPolling(state, action: PayloadAction<boolean>) {
      state.polling = action.payload;
    },
    setLastArmSummary(state, action: PayloadAction<string | undefined>) {
      state.lastArmSummary = action.payload;
    },
  },
});

export const {
  addBoard,
  removeBoard,
  setBoardHealth,
  setArmParams,
  setPolling,
  setLastArmSummary,
} = actions;

export default reducer;
