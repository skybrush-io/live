import { createSelector } from '@reduxjs/toolkit';

import { isSiteSurveyDialogOpen } from '~/features/site-survey/selectors';
import { type AppSelector } from '~/store/reducers';

import { HotkeyScope } from './types';

export const getActiveHotkeyScope: AppSelector<HotkeyScope> = createSelector(
  isSiteSurveyDialogOpen,
  (isSiteSurveyDialogOpen) => {
    switch (true) {
      case isSiteSurveyDialogOpen:
        return HotkeyScope.SITE_SURVEY;

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
