import {
  areItemsInUploadBacklog,
  getFailedUploadItems,
  getItemsInUploadBacklog,
  getSuccessfulUploadItems,
  isItemInUploadBacklog,
  isUploadInProgress,
} from './selectors';
import {
  putUavInWaitingQueue,
  removeUavFromWaitingQueue,
  setupNextUploadJob,
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

/**
 * Function that starts an upload job with the given type, using a selector
 * function to derive the set of UAV IDs to put in the upload queue when there
 * are no items in the queue yet. If there are any items in the backlog when the
 * action is invoked, the selector is ignored and the items in the backlog will
 * be processed instead.
 */
export function startUploadWithUavIdsFromSelector(selector) {
  return (dispatch, getState) => {
    const state = getState();
    const targets = areItemsInUploadBacklog(state)
      ? getItemsInUploadBacklog(state)
      : selector
      ? selector(state)
      : null;

    // Set up the next upload job and start it if at least one target was
    // selected
    if (targets && targets.length > 0) {
      dispatch(setupNextUploadJob({ targets, type: 'show-upload' }));
      dispatch(startUpload());
    }
  };
}
