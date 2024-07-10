import { AppSelector } from '~/store/reducers';
import { type Identifier } from '~/utils/collections';

/**
 * Returns whether the firmware update setup dialog is supposed to be open.
 */
export const isFirmwareUpdateSetupDialogOpen: AppSelector<boolean> = (state) =>
  state.firmwareUpdate.dialog.open;

/**
 * Returns an identifier list for objects that have been reported to support
 * the given firmware update target by the server, or undefined, if the
 * requested information has not been fetched yet.
 */
export const getSupportingObjectIdsForTargetId: AppSelector<
  Identifier[] | undefined,
  [Identifier]
> = (state, targetId: Identifier) =>
  state.firmwareUpdate.supportingObjectIdsByTargetIds[targetId];
