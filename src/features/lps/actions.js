import messageHub from '~/message-hub';

/**
 * Action thunk that starts a calibration process on the local positioning
 * system with the given ID.
 */
export function startLPSCalibration(lpsId) {
  return async (dispatch) => {
    await messageHub.execute.startLPSCalibration(lpsId);
  };
}
