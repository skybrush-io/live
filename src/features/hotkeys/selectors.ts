import { createSelector } from '@reduxjs/toolkit';

import { isShowConfiguratorDialogOpen } from '~/features/show-configurator/selectors';
import { type AppSelector } from '~/store/reducers';

import { HotkeyScope } from './types';

export const getActiveHotkeyScope: AppSelector<HotkeyScope> = createSelector(
  isShowConfiguratorDialogOpen,
  (isShowConfiguratorDialogOpen) => {
    switch (true) {
      case isShowConfiguratorDialogOpen:
        return HotkeyScope.SHOW_CONFIGURATOR;

      default:
        return HotkeyScope.GLOBAL;
    }
  }
);

export const getPendingUAVId: AppSelector<string> = (state) =>
  state.hotkeys.pendingUAVId;

export const isHotkeyDialogVisible: AppSelector<boolean> = (state) =>
  state.hotkeys.dialogVisible;

export const isPendingUAVIdOverlayVisible: AppSelector<boolean> = (state) =>
  state.hotkeys.pendingUAVId.length > 0;
