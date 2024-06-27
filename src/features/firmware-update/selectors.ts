import { AppSelector } from '~/store/reducers';

/**
 * Returns whether the firmware update setup dialog is supposed to be open.
 */
export const isFirmwareUpdateSetupDialogOpen: AppSelector<boolean> = (state) =>
  state.firmwareUpdate.dialog.open;
