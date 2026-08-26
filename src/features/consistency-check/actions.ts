import {
  createFileImportFromFileThunk,
  createProceedToUploadDialogThunk,
  createShowSetupDialogThunk,
} from '~/features/upload-support/setup-dialog/actions';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import { parseParameterNames } from './formatting';
import { getConsistencyCheckJobPayload } from './selectors';
import {
  addConsistencyCheckParameterNames,
  closeConsistencyCheckSetupDialog,
  showConsistencyCheckSetupDialog,
} from './slice';

/**
 * Closes the consistency-check setup dialog and opens the upload dialog with
 * the current parameter name list as the job payload.
 */
export const proceedToConsistencyCheck = createProceedToUploadDialogThunk(
  CONSISTENCY_CHECK_JOB_TYPE,
  getConsistencyCheckJobPayload,
  closeConsistencyCheckSetupDialog,
  showConsistencyCheckSetupDialog
);

/**
 * Shows the upload dialog if a consistency-check upload is in progress,
 * otherwise shows the consistency-check setup dialog.
 */
export const showConsistencyCheckDialog = createShowSetupDialogThunk(
  CONSISTENCY_CHECK_JOB_TYPE,
  showConsistencyCheckSetupDialog
);

/**
 * Imports parameter names from a text file (one name per line) into the
 * consistency-check list.
 */
export const importConsistencyCheckNamesFromFile =
  createFileImportFromFileThunk(
    parseParameterNames,
    addConsistencyCheckParameterNames,
    'Error while parsing parameter names from file'
  );
