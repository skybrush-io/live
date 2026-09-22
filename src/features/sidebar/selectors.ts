import type { AppSelector } from '~/store/reducers';

export const isSidebarOpen: AppSelector<boolean> = (state) =>
  state.sidebar.open;
