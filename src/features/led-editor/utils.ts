/**
 * @file Pure helpers for the LED-show editor, shared by the slice and the UI.
 */

import {
  type Board,
  type DronePixels,
  type LedsPerDrone,
  type RGB,
} from './types';

export const BLACK: RGB = [0, 0, 0];

/** Default per-board duration (seconds) when a new board is created. */
export const DEFAULT_BOARD_DURATION_SEC = 2;

/** Canvas pixel dimensions of a board's formation. */
export const gridDimensions = (
  rows: number,
  cols: number,
  ledsPerDrone: LedsPerDrone
): { width: number; height: number } => ({
  width: cols * ledsPerDrone,
  height: rows * ledsPerDrone,
});

/**
 * Pick a near-square formation that fits `count` drones (columns ≥ rows), e.g.
 * 21 → 5×5, 12 → 3×4. Editing one axis in the UI re-fits the other.
 */
export const defaultFormation = (
  count: number
): { rows: number; cols: number } => {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  return { rows, cols };
};

/** Convert a flat row-major pixel index into `(x, y)` coordinates. */
export const indexToXY = (
  index: number,
  width: number
): { x: number; y: number } => ({
  x: index % width,
  y: Math.floor(index / width),
});

/** Convert `(x, y)` coordinates into a flat row-major pixel index. */
export const xyToIndex = (x: number, y: number, width: number): number =>
  y * width + x;

/**
 * Map a board canvas index to the drone it belongs to and the local index
 * within that drone's `k*k` set, given the board's column count.
 */
export const droneAndLocal = (
  canvasIndex: number,
  cols: number,
  ledsPerDrone: LedsPerDrone
): { drone: number; local: number } => {
  const width = cols * ledsPerDrone;
  const x = canvasIndex % width;
  const y = Math.floor(canvasIndex / width);
  const drone =
    Math.floor(y / ledsPerDrone) * cols + Math.floor(x / ledsPerDrone);
  const local = (y % ledsPerDrone) * ledsPerDrone + (x % ledsPerDrone);
  return { drone, local };
};

/** Which drone (0-based, reading order) owns a given canvas pixel. */
export const droneIndexForPixel = (
  canvasIndex: number,
  _width: number,
  ledsPerDrone: LedsPerDrone,
  cols: number
): number => droneAndLocal(canvasIndex, cols, ledsPerDrone).drone;

/** Create a fresh all-black `k*k` drone pixel set. */
export const makeBlackDrone = (ledsPerDrone: LedsPerDrone): DronePixels =>
  Array.from({ length: ledsPerDrone * ledsPerDrone }, () => [...BLACK] as RGB);

/** Create `count` fresh all-black drone sets. */
export const makeBlackDrones = (
  count: number,
  ledsPerDrone: LedsPerDrone
): DronePixels[] =>
  Array.from({ length: count }, () => makeBlackDrone(ledsPerDrone));

/**
 * Resize a single drone's pixel set when `ledsPerDrone` changes, keeping the
 * top-left overlap.
 */
export const resizeDrone = (
  pixels: DronePixels,
  oldK: number,
  newK: number
): DronePixels => {
  const next = Array.from({ length: newK * newK }, () => [...BLACK] as RGB);
  const copy = Math.min(oldK, newK);
  for (let y = 0; y < copy; y++) {
    for (let x = 0; x < copy; x++) {
      next[y * newK + x] = [...(pixels[y * oldK + x] ?? BLACK)] as RGB;
    }
  }
  return next;
};

/** Read a board pixel by canvas index (returns black for absent drones). */
export const boardPixelAt = (
  board: Board,
  canvasIndex: number,
  cols: number,
  ledsPerDrone: LedsPerDrone
): RGB => {
  const { drone, local } = droneAndLocal(canvasIndex, cols, ledsPerDrone);
  return (board.drones[drone]?.[local] ?? BLACK) as RGB;
};

/** Total length of the timeline = end of the last board. */
export const timelineDurationSec = (boards: Board[]): number =>
  boards.reduce((max, b) => Math.max(max, b.startSec + b.durationSec), 0);

/** The board whose span covers time `t`, or undefined (a gap). */
export const boardActiveAt = (boards: Board[], t: number): Board | undefined =>
  boards.find((b) => t >= b.startSec && t < b.startSec + b.durationSec);

/**
 * The board that defines the *formation* shown at time `t`: the active board,
 * or — during a gap — the most recent board to have started, so drones keep
 * their layout (and just go dark) rather than jumping around.
 */
export const formationBoardAt = (
  boards: Board[],
  t: number
): Board | undefined => {
  const active = boardActiveAt(boards, t);
  if (active) {
    return active;
  }
  let best: Board | undefined;
  for (const b of boards) {
    if (b.startSec <= t && (!best || b.startSec > best.startSec)) {
      best = b;
    }
  }
  return best ?? boards[0];
};

/** A sampled frame of the show: formation + per-drone colours (undefined = dark). */
export type PlaybackFrame = {
  rows: number;
  cols: number;
  /** Per-drone colour sets at this time, or undefined during a gap (all dark). */
  drones: DronePixels[] | undefined;
};

/** Sample the show at time `t` for playback in the simulator / 3D view. */
export const computePlaybackFrame = (
  boards: Board[],
  droneCount: number,
  ledsPerDrone: LedsPerDrone,
  t: number
): PlaybackFrame => {
  const formation = formationBoardAt(boards, t);
  const fit = defaultFormation(droneCount);
  return {
    rows: formation?.rows ?? fit.rows,
    cols: formation?.cols ?? fit.cols,
    drones: boardActiveAt(boards, t)?.drones,
  };
};

const spansOverlap = (a: Board, b: Board): boolean =>
  a.startSec < b.startSec + b.durationSec &&
  b.startSec < a.startSec + a.durationSec;

/** Return true if any two boards overlap on the timeline. */
export const hasOverlappingBoards = (boards: Board[]): boolean => {
  const ordered = [...boards].sort((a, b) => a.startSec - b.startSec);
  for (let i = 1; i < ordered.length; i++) {
    if (spansOverlap(ordered[i - 1]!, ordered[i]!)) {
      return true;
    }
  }
  return false;
};

/** Clamp a single 0..255 color channel to a valid integer. */
export const clampChannel = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

/** Format an RGB triplet as a CSS `rgb(...)` string. */
export const rgbToCss = ([r, g, b]: RGB): string => `rgb(${r}, ${g}, ${b})`;

/** Format an RGB triplet as an uppercase `#RRGGBB` hex string. */
export const rgbToHex = ([r, g, b]: RGB): string =>
  '#' +
  [r, g, b]
    .map((c) => clampChannel(c).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

/** Parse a `#RRGGBB` hex string into an RGB triplet. */
export const hexToRgb = (hex: string): RGB => {
  const normalized = hex.replace('#', '');
  return [
    parseInt(normalized.slice(0, 2), 16) || 0,
    parseInt(normalized.slice(2, 4), 16) || 0,
    parseInt(normalized.slice(4, 6), 16) || 0,
  ];
};
