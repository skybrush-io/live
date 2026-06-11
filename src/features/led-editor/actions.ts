/**
 * @file Thunk actions for the LED-show editor — compiling and uploading the
 * show to the Skybrush server (which forwards the per-drone `.bin` files to the
 * external download server).
 */

import ky from 'ky';

import { showError, showSuccess } from '~/features/snackbar/actions';
import { type AppThunk, type RootState } from '~/store/reducers';

import {
  getBoards,
  getDroneCount,
  getFps,
  getLedsPerDrone,
  hasTimelineOverlap,
} from './selectors';
import { setUploadStatus } from './slice';
import { type UploadTileResult } from './types';

const COMPILE_ENDPOINT = '/api/v1/led/compile';

type CompileResponse = {
  success: boolean;
  totalFrames: number;
  fps: number;
  tileWidth: number;
  tileHeight: number;
  droneCount: number;
  uploaded: boolean;
  tiles: UploadTileResult[];
  error?: string;
};

/**
 * Build the JSON model the server's `led_generator` extension expects.
 *
 * Colours are sent **per drone** (each drone's `k*k` set). The per-board
 * formation (rows × cols) is included for reference but does not affect the
 * generated `.bin` files — those only depend on each drone's own LED sequence.
 */
const buildShowModel = (state: RootState) => ({
  ledsPerDrone: getLedsPerDrone(state),
  droneCount: getDroneCount(state),
  fps: getFps(state),
  boards: getBoards(state).map((board) => ({
    id: board.id,
    name: board.name,
    rows: board.rows,
    cols: board.cols,
    drones: board.drones,
    startSec: board.startSec,
    durationSec: board.durationSec,
  })),
});

/**
 * Compile the current show on the server and upload the per-drone `.bin` files
 * to the download server.
 */
export const exportAndUpload =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const state = getState();

    if (getBoards(state).length === 0) {
      dispatch(showError('Add at least one board before exporting.'));
      return;
    }
    if (hasTimelineOverlap(state)) {
      dispatch(
        showError('Boards overlap on the timeline; fix this before exporting.')
      );
      return;
    }

    const model = buildShowModel(state);
    dispatch(setUploadStatus({ state: 'running' }));

    try {
      const response = await ky
        .post(COMPILE_ENDPOINT, { json: model, timeout: 120_000 })
        .json<CompileResponse>();

      const failed = (response.tiles ?? []).filter((t) => t.error);
      if (response.success && failed.length === 0) {
        dispatch(
          setUploadStatus({
            state: 'done',
            totalFrames: response.totalFrames,
            tiles: response.tiles,
            message: `Uploaded ${response.tiles.length} file(s), ${response.totalFrames} frame(s).`,
          })
        );
        dispatch(
          showSuccess(
            `LED show compiled: ${response.droneCount} drone(s), ${response.totalFrames} frame(s).`
          )
        );
      } else {
        dispatch(
          setUploadStatus({
            state: 'error',
            totalFrames: response.totalFrames,
            tiles: response.tiles,
            message: `${failed.length} file(s) failed to upload.`,
          })
        );
        dispatch(showError(`LED show upload failed for ${failed.length} file(s).`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(setUploadStatus({ state: 'error', message }));
      dispatch(showError(`Could not compile LED show: ${message}`));
    }
  };
