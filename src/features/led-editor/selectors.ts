/**
 * @file Selectors for the LED-show editor feature.
 */

import { type RootState } from '~/store/reducers';

import { type Board } from './types';
import { gridDimensions, hasOverlappingBoards, timelineDurationSec } from './utils';

export const getLedEditorState = (state: RootState) => state.ledEditor;

export const getLedsPerDrone = (state: RootState) =>
  state.ledEditor.ledsPerDrone;

export const getDroneCount = (state: RootState) => state.ledEditor.droneCount;

export const getFps = (state: RootState) => state.ledEditor.fps;

export const getBoards = (state: RootState): Board[] => state.ledEditor.boards;

export const getSelectedBoardIds = (state: RootState): string[] =>
  state.ledEditor.selectedBoardIds;

export const getSelectedBoards = (state: RootState): Board[] => {
  const selected = new Set(state.ledEditor.selectedBoardIds);
  return state.ledEditor.boards.filter((b) => selected.has(b.id));
};

/** The board currently shown/edited in the bulb grid (the last selected). */
export const getActiveBoard = (state: RootState): Board | undefined => {
  const ids = state.ledEditor.selectedBoardIds;
  const id = ids[ids.length - 1];
  return id ? state.ledEditor.boards.find((b) => b.id === id) : undefined;
};

/** The active board's formation (falls back to a 1×1 placeholder). */
export const getActiveArrangement = (
  state: RootState
): { rows: number; cols: number } => {
  const board = getActiveBoard(state);
  return { rows: board?.rows ?? 1, cols: board?.cols ?? 1 };
};

/** Canvas pixel dimensions of the active board's formation. */
export const getActiveGridDimensions = (state: RootState) => {
  const { rows, cols } = getActiveArrangement(state);
  return gridDimensions(rows, cols, state.ledEditor.ledsPerDrone);
};

export const getSelectedPixels = (state: RootState) =>
  state.ledEditor.selectedPixels;

export const getActiveColor = (state: RootState) => state.ledEditor.activeColor;

export const getClipboard = (state: RootState) => state.ledEditor.clipboard;

export const getBoardClipboard = (state: RootState) =>
  state.ledEditor.boardClipboard;

export const getPlayheadSec = (state: RootState) => state.ledEditor.playheadSec;

export const getPlaying = (state: RootState) => state.ledEditor.playing;

export const getUploadStatus = (state: RootState) => state.ledEditor.upload;

export const getTimelineDuration = (state: RootState) =>
  timelineDurationSec(state.ledEditor.boards);

export const hasTimelineOverlap = (state: RootState) =>
  hasOverlappingBoards(state.ledEditor.boards);

/** Whether the show is ready to be compiled and uploaded. */
export const canExport = (state: RootState) =>
  state.ledEditor.boards.length > 0 &&
  !hasOverlappingBoards(state.ledEditor.boards) &&
  state.ledEditor.upload.state !== 'running';
