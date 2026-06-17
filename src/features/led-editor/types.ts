/**
 * @file Type definitions for the LED-show editor feature.
 *
 * Each drone carries a `k×k` LED panel (`ledsPerDrone = k`). The **drone count**
 * and **FPS** are global, fixed properties of the show. Each **board**, however,
 * owns its own **formation** (`rows × cols`) so the same dance can be shown in
 * different formations as the flight evolves.
 *
 * Crucially, colours are stored **per drone** (each drone's `k×k` set), not as a
 * flat canvas. Drones are numbered in reading order (left→right, top→bottom), so
 * when a board's formation changes the drones simply re-flow into the new grid
 * while keeping their LED contents intact as a unit.
 */

/** An RGB triplet, each channel in the 0..255 range. */
export type RGB = [number, number, number];

/** Number of LEDs per drone edge (so each drone is `k×k`). */
export type LedsPerDrone = 3 | 4;

/** One drone's LED colours, row-major, length `k*k`. */
export type DronePixels = RGB[];

/** A still frame placed on the timeline, with its own formation. */
export type Board = {
  id: string;
  name: string;
  /** Formation rows for this board. */
  rows: number;
  /** Formation columns for this board. */
  cols: number;
  /** Per-drone colour sets, length `droneCount`; each entry is `k*k` long. */
  drones: DronePixels[];
  startSec: number;
  durationSec: number;
};

/** A rectangular block of pixels held on the editor clipboard. */
export type Clipboard = {
  width: number;
  height: number;
  pixels: RGB[];
};

/** Per-drone result of a compile + upload request. */
export type UploadTileResult = {
  droneIndex: number;
  bytes: number;
  filename?: string;
  url?: string;
  message?: string;
  error?: string;
};

export type UploadState = 'idle' | 'running' | 'done' | 'error';

export type UploadStatus = {
  state: UploadState;
  message?: string;
  totalFrames?: number;
  tiles?: UploadTileResult[];
};

export type LedEditorState = {
  // --- global show properties (fixed at the top of the editor) ---
  ledsPerDrone: LedsPerDrone;
  droneCount: number;
  fps: number;

  // --- boards ---
  boards: Board[];

  // --- editor UI state ---
  /**
   * Selected timeline boards, in click order. The last entry is the "active"
   * board shown and edited in the bulb grid.
   */
  selectedBoardIds: string[];
  /**
   * Selected bulbs as *canvas indices* within the active board's current
   * formation (`index = y * (cols*k) + x`).
   */
  selectedPixels: number[];
  /** Pixel colours copied from the bulb grid. */
  clipboard: Clipboard | undefined;
  /** Boards copied from the timeline. */
  boardClipboard: Board[] | undefined;
  activeColor: RGB;
  /** Shared playback time (seconds) for the timeline scrubber and simulator. */
  playheadSec: number;
  /** Whether the show is currently playing back. */
  playing: boolean;
  upload: UploadStatus;
};
