import {
  getFailedUploadItems,
  getSuccessfulUploadItems,
  isItemInUploadBacklog,
  isUploadInProgress,
} from './selectors';
import {
  putUavInWaitingQueue,
  removeUavFromWaitingQueue,
  startUpload,
  _enqueueFailedUploads,
  _enqueueSuccessfulUploads,
} from './slice';

/**
 * Thunk that restarts the upload process on all UAVs that are currently
 * marked as successful.
 */
export function restartSuccessfulUploads() {
  return (dispatch, getState) => {
    const successfulItems = getSuccessfulUploadItems(getState());
    dispatch(_enqueueSuccessfulUploads(successfulItems));
    if (!isUploadInProgress(getState())) {
      dispatch(startUpload());
    }
  };
}

/**
 * Thunk that retrieves all failed upload items from the state, places all of
 * them in the upload queue and then restarts the upload process if needed.
 */
export function retryFailedUploads() {
  return (dispatch, getState) => {
    const failedItems = getFailedUploadItems(getState());
    dispatch(_enqueueFailedUploads(failedItems));
    if (!isUploadInProgress(getState())) {
      dispatch(startUpload());
    }
  };
}

/**
 * Toggles a single UAV into our out of the upload queue, assuming that it is
 * in a state where such modification is allowed.
 */
export function toggleUavInWaitingQueue(uavId) {
  return (dispatch, getState) => {
    const state = getState();
    if (isItemInUploadBacklog(state, uavId)) {
      dispatch(removeUavFromWaitingQueue(uavId));
    } else {
      dispatch(putUavInWaitingQueue(uavId));
    }
  };
}
