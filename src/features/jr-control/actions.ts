/**
 * @file Thunks for the JR-board control panel — talking to the Skybrush
 * server's `jr_control` extension at `/api/v1/jr`.
 */

import ky from 'ky';

import { showError, showSuccess } from '~/features/snackbar/actions';
import { type AppThunk, type RootState } from '~/store/reducers';

import {
  setBoardHealth,
  setLastArmSummary,
  type ArmParams,
  type JRHealth,
} from './slice';

const JR_BASE = '/api/v1/jr';

/** Poll a single board's `/health` and store the result. */
export const refreshBoardHealth =
  (ip: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    try {
      const health = await ky
        .get(`${JR_BASE}/health/${ip}`, { timeout: 8000 })
        .json<JRHealth>();
      dispatch(setBoardHealth({ ip, health }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(setBoardHealth({ ip, error: message }));
    }
  };

/** Poll all configured boards' health. */
export const refreshAllBoards =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const state: RootState = getState();
    await Promise.all(
      state.jrControl.boards.map((board) =>
        dispatch(refreshBoardHealth(board.ip))
      )
    );
  };

/** Reboot a board. */
export const rebootBoard =
  (ip: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    try {
      await ky.post(`${JR_BASE}/reboot/${ip}`, { timeout: 8000 }).json();
      dispatch(showSuccess(`Reboot requested for ${ip}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(showError(`Reboot failed for ${ip}: ${message}`));
    }
  };

/** Trigger a re-download of the show file on a board. */
export const redownloadBoard =
  (ip: string): AppThunk<Promise<void>> =>
  async (dispatch) => {
    try {
      await ky.post(`${JR_BASE}/redownload/${ip}`, { timeout: 8000 }).json();
      dispatch(showSuccess(`Re-download requested for ${ip}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(showError(`Re-download failed for ${ip}: ${message}`));
    }
  };

/** Broadcast an ARM sync packet to all boards over UDP. */
export const broadcastArm =
  (): AppThunk<Promise<void>> => async (dispatch, getState) => {
    const state: RootState = getState();
    const arm: ArmParams = state.jrControl.arm;
    try {
      const summary = await ky
        .post(`${JR_BASE}/arm`, { json: arm, timeout: 15_000 })
        .json<{ sent: number; startTimeUs: number }>();
      dispatch(
        setLastArmSummary(
          `ARM sent ×${summary.sent}, start_time=${summary.startTimeUs} µs`
        )
      );
      dispatch(showSuccess(`ARM broadcast sent (${summary.sent} packets).`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(setLastArmSummary(`ARM failed: ${message}`));
      dispatch(showError(`ARM broadcast failed: ${message}`));
    }
  };
