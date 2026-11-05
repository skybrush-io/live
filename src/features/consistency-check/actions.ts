import { waitForDialogTransition } from '~/components/transitions/utils';
import {
  replaceManifest,
  showParameterUploadSetupDialog,
} from '~/features/parameters/slice';
import type { ParameterData } from '~/features/parameters/types';
import {
  createFileImportFromFileThunk,
  createProceedToUploadDialogThunk,
  createShowSetupDialogThunk,
} from '~/features/upload-support/setup-dialog/actions';
import type { ValueFix } from '~/features/upload-support/value-consistency/types';
import { closeUploadDialog } from '~/features/upload/slice';
import type { AppThunk } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

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

/**
 * Converts the given fixes to the items of a parameter manifest and the list
 * of UAVs that the parameters should be uploaded to.
 *
 * The items are UAV-specific only if it is strictly necessary, i.e. if the
 * affected UAVs need different sets of parameter changes. Otherwise, each
 * parameter appears only once in the manifest and the upload is restricted to
 * the affected UAVs.
 */
function createManifestFromFixes(fixes: ValueFix[]): {
  items: ParameterData[];
  targets: Identifier[];
} {
  const changesByUAV = new Map<Identifier, ParameterData[]>();
  for (const { name, value, uavIds } of fixes) {
    for (const uavId of uavIds) {
      const changes = changesByUAV.get(uavId) ?? [];
      changes.push({ name, uavId: undefined, value });
      changesByUAV.set(uavId, changes);
    }
  }

  const targets = [...changesByUAV.keys()];
  const changeSets = [...changesByUAV.values()];
  const formatChanges = (changes: ParameterData[]) =>
    changes
      .map(({ name, value }) => `${name}=${value}`)
      .sort()
      .join('\n');
  const distinctChangeSets = new Set(changeSets.map(formatChanges));

  const items =
    distinctChangeSets.size === 1
      ? changeSets[0]
      : fixes.flatMap(({ name, value, uavIds }) =>
          uavIds.map((uavId) => ({ name, uavId, value }))
        );

  return { items, targets };
}

/**
 * Closes the upload dialog and opens the parameter upload setup dialog with
 * the parameter manifest replaced by the given fixes, so the user can review
 * them before uploading them to the affected UAVs.
 */
export const fixInconsistentParameters =
  (fixes: ValueFix[]): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const { items, targets } = createManifestFromFixes(fixes);
    if (items.length === 0) {
      return;
    }

    dispatch(closeUploadDialog());
    await waitForDialogTransition();
    dispatch(replaceManifest({ items, targets }));
    dispatch(showParameterUploadSetupDialog());
  };
