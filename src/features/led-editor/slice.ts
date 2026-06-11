/**
 * @file Redux slice storing the state of the LED-show editor.
 *
 * Drone count, LEDs-per-drone and FPS are global; each board owns its own
 * formation (rows × cols) and stores colours per drone so drones keep their LED
 * contents intact when a board's formation changes.
 */

import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

import {
  type Board,
  type Clipboard,
  type LedEditorState,
  type LedsPerDrone,
  type RGB,
  type UploadStatus,
} from './types';
import {
  BLACK,
  DEFAULT_BOARD_DURATION_SEC,
  defaultFormation,
  droneAndLocal,
  gridDimensions,
  indexToXY,
  makeBlackDrone,
  makeBlackDrones,
  resizeDrone,
  timelineDurationSec,
  xyToIndex,
} from './utils';

const DEFAULT_LEDS_PER_DRONE: LedsPerDrone = 4;
const DEFAULT_DRONE_COUNT = 21;

const initialState: LedEditorState = {
  ledsPerDrone: DEFAULT_LEDS_PER_DRONE,
  droneCount: DEFAULT_DRONE_COUNT,
  fps: 15,
  boards: [],
  selectedBoardIds: [],
  selectedPixels: [],
  clipboard: undefined,
  boardClipboard: undefined,
  activeColor: [255, 255, 255],
  playheadSec: 0,
  upload: { state: 'idle' },
};

/** The board the user is currently editing (the last one selected), if any. */
const activeBoard = (state: LedEditorState): Board | undefined => {
  const id = state.selectedBoardIds[state.selectedBoardIds.length - 1];
  return id ? state.boards.find((b) => b.id === id) : undefined;
};

/** Canvas width of the active board's formation. */
const activeWidth = (state: LedEditorState): number => {
  const board = activeBoard(state);
  return (board?.cols ?? 1) * state.ledsPerDrone;
};

/** Read a colour from the active board by canvas index. */
const readPixel = (state: LedEditorState, canvasIndex: number): RGB => {
  const board = activeBoard(state);
  if (!board) {
    return [...BLACK];
  }
  const { drone, local } = droneAndLocal(
    canvasIndex,
    board.cols,
    state.ledsPerDrone
  );
  return [...(board.drones[drone]?.[local] ?? BLACK)] as RGB;
};

/** Write a colour into the active board at a canvas index. */
const writePixel = (
  state: LedEditorState,
  canvasIndex: number,
  color: RGB
): void => {
  const board = activeBoard(state);
  if (!board) {
    return;
  }
  const { drone, local } = droneAndLocal(
    canvasIndex,
    board.cols,
    state.ledsPerDrone
  );
  if (drone >= 0 && drone < state.droneCount && board.drones[drone]) {
    board.drones[drone]![local] = [...color];
  }
};

const cloneBoardDrones = (board: Board): RGB[][] =>
  board.drones.map((drone) => drone.map((p) => [...p] as RGB));

const { actions, reducer } = createSlice({
  name: 'led-editor',
  initialState,
  reducers: {
    setLedsPerDrone(state, action: PayloadAction<LedsPerDrone>) {
      const oldK = state.ledsPerDrone;
      const newK = action.payload;
      if (oldK === newK) {
        return;
      }
      state.ledsPerDrone = newK;
      for (const board of state.boards) {
        board.drones = board.drones.map((drone) =>
          resizeDrone(drone, oldK, newK)
        );
      }
      state.selectedPixels = [];
      state.clipboard = undefined;
    },

    setDroneCount(state, action: PayloadAction<number>) {
      const count = Math.max(1, Math.round(action.payload));
      state.droneCount = count;
      for (const board of state.boards) {
        // Grow / shrink the per-drone sets to match the new count.
        if (board.drones.length < count) {
          while (board.drones.length < count) {
            board.drones.push(makeBlackDrone(state.ledsPerDrone));
          }
        } else if (board.drones.length > count) {
          board.drones.length = count;
        }
        // Ensure the formation has room for every drone.
        if (board.rows * board.cols < count) {
          const fit = defaultFormation(count);
          board.rows = fit.rows;
          board.cols = fit.cols;
        }
      }
      state.selectedPixels = [];
    },

    setFps(state, action: PayloadAction<number>) {
      state.fps = Math.max(1, Math.round(action.payload));
    },

    /**
     * Change a board's formation. Editing one axis re-fits the other to the
     * (global) drone count, so the formation always holds every drone.
     */
    setBoardArrangement(
      state,
      action: PayloadAction<{ id: string; rows?: number; cols?: number }>
    ) {
      const board = state.boards.find((b) => b.id === action.payload.id);
      if (!board) {
        return;
      }
      const count = state.droneCount;
      if (action.payload.cols !== undefined) {
        const cols = Math.max(1, Math.round(action.payload.cols));
        board.cols = cols;
        board.rows = Math.max(1, Math.ceil(count / cols));
      } else if (action.payload.rows !== undefined) {
        const rows = Math.max(1, Math.round(action.payload.rows));
        board.rows = rows;
        board.cols = Math.max(1, Math.ceil(count / rows));
      }
      state.selectedPixels = [];
    },

    setActiveColor(state, action: PayloadAction<RGB>) {
      state.activeColor = action.payload;
    },

    addBoard(state, action: PayloadAction<{ name?: string } | undefined>) {
      const fit = defaultFormation(state.droneCount);
      const startSec = timelineDurationSec(state.boards);
      const board: Board = {
        id: nanoid(),
        name: action.payload?.name ?? `Board ${state.boards.length + 1}`,
        rows: fit.rows,
        cols: fit.cols,
        drones: makeBlackDrones(state.droneCount, state.ledsPerDrone),
        startSec,
        durationSec: DEFAULT_BOARD_DURATION_SEC,
      };
      state.boards.push(board);
      state.selectedBoardIds = [board.id];
      state.selectedPixels = [];
    },

    removeBoard(state, action: PayloadAction<string>) {
      state.boards = state.boards.filter((b) => b.id !== action.payload);
      state.selectedBoardIds = state.selectedBoardIds.filter(
        (id) => id !== action.payload
      );
      state.selectedPixels = [];
    },

    removeSelectedBoards(state) {
      const selected = new Set(state.selectedBoardIds);
      state.boards = state.boards.filter((b) => !selected.has(b.id));
      state.selectedBoardIds = [];
      state.selectedPixels = [];
    },

    selectBoard(state, action: PayloadAction<string | undefined>) {
      state.selectedBoardIds = action.payload ? [action.payload] : [];
      state.selectedPixels = [];
    },

    toggleBoardSelection(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.selectedBoardIds.includes(id)) {
        state.selectedBoardIds = state.selectedBoardIds.filter((x) => x !== id);
      } else {
        state.selectedBoardIds.push(id);
      }
      state.selectedPixels = [];
    },

    setSelectedBoards(state, action: PayloadAction<string[]>) {
      state.selectedBoardIds = action.payload;
      state.selectedPixels = [];
    },

    copyBoards(state) {
      const selected = new Set(state.selectedBoardIds);
      const copied = state.boards
        .filter((b) => selected.has(b.id))
        .sort((a, b) => a.startSec - b.startSec)
        .map((b) => ({ ...b, drones: cloneBoardDrones(b) }));
      state.boardClipboard = copied.length > 0 ? copied : state.boardClipboard;
    },

    pasteBoards(state) {
      const clip = state.boardClipboard;
      if (!clip || clip.length === 0) {
        return;
      }
      const base = timelineDurationSec(state.boards);
      const clipStart = Math.min(...clip.map((b) => b.startSec));
      const newIds: string[] = [];
      for (const board of clip) {
        const id = nanoid();
        newIds.push(id);
        state.boards.push({
          ...board,
          id,
          name: `${board.name} copy`,
          startSec: base + (board.startSec - clipStart),
          drones: board.drones.map((drone) => drone.map((p) => [...p] as RGB)),
        });
      }
      state.selectedBoardIds = newIds;
      state.selectedPixels = [];
    },

    renameBoard(state, action: PayloadAction<{ id: string; name: string }>) {
      const board = state.boards.find((b) => b.id === action.payload.id);
      if (board) {
        board.name = action.payload.name;
      }
    },

    setBoardTiming(
      state,
      action: PayloadAction<{
        id: string;
        startSec?: number;
        durationSec?: number;
      }>
    ) {
      const board = state.boards.find((b) => b.id === action.payload.id);
      if (!board) {
        return;
      }
      if (action.payload.startSec !== undefined) {
        board.startSec = Math.max(0, action.payload.startSec);
      }
      if (action.payload.durationSec !== undefined) {
        board.durationSec = Math.max(0.1, action.payload.durationSec);
      }
    },

    /** Paint canvas pixels of the active board with a colour. */
    paintPixels(
      state,
      action: PayloadAction<{ indices: number[]; color: RGB }>
    ) {
      for (const index of action.payload.indices) {
        writePixel(state, index, action.payload.color);
      }
    },

    setSelectedPixels(state, action: PayloadAction<number[]>) {
      state.selectedPixels = action.payload;
    },

    clearSelection(state) {
      state.selectedPixels = [];
    },

    /** Copy the bounding box of the current selection into the clipboard. */
    copySelection(state) {
      const board = activeBoard(state);
      if (!board || state.selectedPixels.length === 0) {
        return;
      }
      const width = activeWidth(state);
      const coords = state.selectedPixels.map((i) => indexToXY(i, width));
      const minX = Math.min(...coords.map((c) => c.x));
      const maxX = Math.max(...coords.map((c) => c.x));
      const minY = Math.min(...coords.map((c) => c.y));
      const maxY = Math.max(...coords.map((c) => c.y));
      const boxW = maxX - minX + 1;
      const boxH = maxY - minY + 1;
      const pixels: RGB[] = [];
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          pixels.push(readPixel(state, xyToIndex(x, y, width)));
        }
      }
      state.clipboard = { width: boxW, height: boxH, pixels };
    },

    /**
     * Paste the clipboard onto the active board.
     * - Multi-bulb selection: tile the clipboard across the whole selection
     *   (a single copied colour fills every selected bulb).
     * - 0–1 bulbs selected: stamp the clipboard block at the anchor.
     */
    pasteClipboard(
      state,
      action: PayloadAction<{ anchorIndex?: number } | undefined>
    ) {
      const board = activeBoard(state);
      const clipboard: Clipboard | undefined = state.clipboard;
      if (!board || !clipboard) {
        return;
      }
      const width = activeWidth(state);
      const height = board.rows * state.ledsPerDrone;
      const selection = state.selectedPixels;

      if (selection.length > 1) {
        const coords = selection.map((i) => indexToXY(i, width));
        const minX = Math.min(...coords.map((c) => c.x));
        const minY = Math.min(...coords.map((c) => c.y));
        for (const index of selection) {
          const { x, y } = indexToXY(index, width);
          const cx = (x - minX) % clipboard.width;
          const cy = (y - minY) % clipboard.height;
          writePixel(
            state,
            index,
            [...clipboard.pixels[cy * clipboard.width + cx]!] as RGB
          );
        }
        return;
      }

      let anchorIndex = action.payload?.anchorIndex;
      if (anchorIndex === undefined) {
        if (selection.length === 0) {
          return;
        }
        anchorIndex = selection[0];
      }
      const { x: ax, y: ay } = indexToXY(anchorIndex!, width);
      for (let y = 0; y < clipboard.height; y++) {
        for (let x = 0; x < clipboard.width; x++) {
          const tx = ax + x;
          const ty = ay + y;
          if (tx < width && ty < height) {
            writePixel(
              state,
              xyToIndex(tx, ty, width),
              [...clipboard.pixels[y * clipboard.width + x]!] as RGB
            );
          }
        }
      }
    },

    setPlayhead(state, action: PayloadAction<number>) {
      state.playheadSec = Math.max(0, action.payload);
    },

    setUploadStatus(state, action: PayloadAction<UploadStatus>) {
      state.upload = action.payload;
    },
  },
});

export const {
  setLedsPerDrone,
  setDroneCount,
  setFps,
  setBoardArrangement,
  setActiveColor,
  addBoard,
  removeBoard,
  removeSelectedBoards,
  selectBoard,
  toggleBoardSelection,
  setSelectedBoards,
  copyBoards,
  pasteBoards,
  renameBoard,
  setBoardTiming,
  paintPixels,
  setSelectedPixels,
  clearSelection,
  copySelection,
  pasteClipboard,
  setPlayhead,
  setUploadStatus,
} = actions;

export default reducer;
