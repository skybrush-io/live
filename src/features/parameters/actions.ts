import {
  createFileImportFromFileThunk,
  createProceedToUploadDialogThunk,
  createShowSetupDialogThunk,
} from '~/features/upload-support/setup-dialog/actions';

import { UPLOAD_JOB_TYPE } from './constants';
import { parseParameters } from './formatting';
import { getParameterUploadJobPayloadFromManifest } from './selectors';
import {
  closeParameterUploadSetupDialog,
  showParameterUploadSetupDialog,
  updateParametersInManifest,
} from './slice';

/**
 * Closes the parameter upload setup dialog and opens the upload dialog with the
 * current parameter manifest as the job payload.
 */
export const proceedToUpload = createProceedToUploadDialogThunk(
  UPLOAD_JOB_TYPE,
  getParameterUploadJobPayloadFromManifest,
  closeParameterUploadSetupDialog,
  showParameterUploadSetupDialog
);

/**
 * Shows the upload dialog if a parameter upload is in progress, otherwise
 * shows the parameter upload setup dialog.
 */
export const showParameterUploadDialog = createShowSetupDialogThunk(
  UPLOAD_JOB_TYPE,
  showParameterUploadSetupDialog
);

/**
 * Imports a parameter file into the parameter manifest.
 */
export const importParametersFromFile = createFileImportFromFileThunk(
  parseParameters,
  updateParametersInManifest,
  'Error while parsing parameters from file'
);
