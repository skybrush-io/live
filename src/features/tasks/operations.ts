import type { AppSelector, AppThunk } from '~/store/reducers';
import { type Outcomes, runMassOperation } from '~/utils/messaging';

import { COMPASS_CALIB_TIMEOUT } from '~/features/uavs/constants';

import { startTask } from './actions';
import { getTaskState } from './selectors';
import type { TaskSpec } from './types';

/**
 * Factory that creates a multi-UAV task action.
 *
 * If the requested task is already in progress for a given UAV ID,
 * the UAV will be skipped.
 *
 * The created action does not support broadcast and transport options.
 */
const makeMultiUAVAction =
  (uavIds: string[], spec: Omit<TaskSpec, 'uavId'>, name: string): AppThunk =>
  (dispatch, getState) =>
    runMassOperation(dispatch, getState, {
      name,
      uavIds,
      isBroadcast: false,
      run: async (dispatch, getState) => {
        const outcomes: Outcomes = {};
        const started: string[] = [];
        const promises: Array<Promise<unknown>> = [];

        for (const uavId of uavIds) {
          const taskSpec = { ...spec, uavId } as TaskSpec;
          const p = dispatch(startTask(taskSpec, { silent: true }));
          if (p === undefined) {
            outcomes[uavId] = 'skipped';
          } else {
            promises.push(p);
            started.push(uavId);
          }
        }

        await Promise.allSettled(promises);

        const finalState = getState();
        for (const uavId of started) {
          const task = getTaskState(finalState, {
            uavId,
            type: spec.type,
            taskId: spec.taskId,
          });
          outcomes[uavId] = task?.status === 'success' ? 'success' : 'failure';
        }

        return outcomes;
      },
    });

/**
 * Pre-defined task specifications (without `uavId`).
 */
export const TASK_SPECS: Record<string, Omit<TaskSpec, 'uavId'>> = {
  compassCalibration: {
    type: 'uav-test',
    taskId: 'compass',
    params: {
      component: 'compass',
      command: 'calib',
      timeout: COMPASS_CALIB_TIMEOUT,
    },
  },
};

/**
 * Multi-UAV compass calibration action factory.
 */
const calibrateCompassMassOp =
  (uavIds: string[]): AppThunk =>
  (dispatch) => {
    if (uavIds.length > 0) {
      dispatch(
        makeMultiUAVAction(
          uavIds,
          TASK_SPECS.compassCalibration,
          'Calibrate compass'
        )
      );
    }
  };

/**
 * Creates Redux thunks for the task-based multi-UAV operations.
 *
 * Created tasks do not support broadcast or transport options.
 */
export const createTaskOperationThunks = ({
  getTargetedUAVIds,
}: {
  getTargetedUAVIds: AppSelector<string[]>;
}) => ({
  calibrateCompass: (): AppThunk => (dispatch, getState) =>
    dispatch(calibrateCompassMassOp(getTargetedUAVIds(getState()))),
});
