import type { RootState, AppSelector } from '~/store/reducers';

export const isSidebarOpen: AppSelector<boolean> = (state: RootState) =>
  state.sidebar.open;