import { setUploadDialogSelectedTab } from '~/features/upload/slice';
import { countResultsByTypeInHistoryItem } from '~/features/upload/utils';
import type { AppThunk } from '~/store/reducers';

import { selectLatestHistoryItem } from './selectors';

/**
 * Returns a post-action that switches the upload dialog to the results tab
 * when the latest run of `jobType` has successes and no errors or
 * cancellations.
 */
export function createShowResultsPostAction(jobType: string): () => AppThunk {
  return () => (dispatch, getState) => {
    const historyItem = selectLatestHistoryItem(getState(), jobType);
    if (historyItem === undefined) {
      return;
    }

    const counts = countResultsByTypeInHistoryItem(historyItem);
    if (counts.error === 0 && counts.success > 0 && counts.cancelled === 0) {
      dispatch(setUploadDialogSelectedTab('results'));
    }
  };
}
