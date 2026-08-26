import { isShowAuthorizedToStart } from '~/features/show/selectors';
import { isUploadInProgress } from '~/features/upload/selectors';
import type { AppSelector } from '~/store/reducers';

export const isSwapDronesDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.swapDrones.open;

export const isSwappingAllowed: AppSelector<boolean> = (state) =>
  !isShowAuthorizedToStart(state) && !isUploadInProgress(state);
