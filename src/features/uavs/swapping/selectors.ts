import type { AppSelector } from '~/store/reducers';

export const isSwapDronesDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.swapDrones.open;
