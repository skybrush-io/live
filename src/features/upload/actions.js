import delay from 'delay';
import isNil from 'lodash-es/isNil';
import { getUAVIdsParticipatingInMissionSortedByMissionIndex } from '~/features/mission/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import { getScopeForJobType, JobScope } from './jobs';

import {
  areItemsInUploadBacklog,
  getFailedUploadItems,
  getItemsInUploadBacklog,
  getSelectedJobInUploadDialog,
  getSuccessfulUploadItems,
  getUploadDialogState,
  isItemInUploadBacklog,
  isUploadInProgress,
} from './selectors';
import {
  closeUploadDialog,
  putUavsInWaitingQueue,
  removeUavsFromWaitingQueue,
  setupNextUploadJob,
  startUpload,
  _enqueueFailedUploads,
  _enqueueSuccessfulUploads,
} from './slice';

/**
 * Thunk that closes the upload dialog and performs the "back" action currently
 * associated to the dialog.
 */
export function closeUploadDialogAndStepBack() {
  return async (dispatch, getState) => {
    const { backAction } = getUploadDialogState(getState());
    dispatch(closeUploadDialog());
    await delay(150);
    if (backAction) {
      dispatch(backAction);
    }
  };
}

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
  return toggleUavsInWaitingQueue([uavId]);
}

/**
 * Toggles multiple UAVs into our out of the upload queue, assuming that the
 * UAVs are in a state where such modification is allowed. The operation
 * performed by this thunk is _consistent_ in a sense that it applies the
 * _same_ operation to _all_ of the UAVs in the given array that are allowed
 * to be modified.
 *
 * For instance, if the given UAV IDs contain a mixture of UAVs that are
 * 1) in the waiting queue, 2) not in any of the queues and 3) are being
 * processed, then the function will _not_ touch any of the UAVs that are
 * being processed (because it is not allowed), and it will put the UAVs
 * _not_ in any of the queues to the _waiting_ queue as that group takes
 * priority. It will remove UAVs from the waiting queue _only_ if the list of
 * UAV IDs contain either UAVs that are all in the waiting queue, or a mixture
 * of UAVs that are either in the waiting queue or are being processed.
 */
export function toggleUavsInWaitingQueue(uavIds) {
  return (dispatch, getState) => {
    const state = getState();
    const toRemove = [];
    const toAdd = [];

    for (const uavId of uavIds) {
      if (!isNil(uavId)) {
        if (isItemInUploadBacklog(state, uavId)) {
          toRemove.push(uavId);
        } else {
          toAdd.push(uavId);
        }
      }
    }

    if (toAdd.length > 0) {
      /* Adding these items and not touching any of those that should be removed */
      dispatch(putUavsInWaitingQueue(toAdd));
    } else if (toRemove.length > 0) {
      dispatch(removeUavsFromWaitingQueue(toRemove));
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
export function startUploadJobFromUploadDialog() {
  return (dispatch, getState) => {
    // Process the state, extract the type of the job that the user selected,
    // and create the payload depending on the job type and the current state
    const state = getState();
    const { type, payload } = getSelectedJobInUploadDialog(state);
    const scope = getScopeForJobType(type);
    let selector;

    switch (scope) {
      case JobScope.MISSION:
        selector = getUAVIdsParticipatingInMissionSortedByMissionIndex;
        break;

      case JobScope.ALL:
      default:
        selector = getUAVIdList;
        break;
    }

    const targets = areItemsInUploadBacklog(state)
      ? getItemsInUploadBacklog(state)
      : selector
      ? selector(state)
      : null;

    // Set up the next upload job and start it if at least one target was
    // selected
    if (targets && targets.length > 0) {
      dispatch(setupNextUploadJob({ targets, type, payload }));
      dispatch(startUpload());
    }
  };
}
