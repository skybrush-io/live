import type { AppThunk } from '~/store/reducers';
import { isSidebarOpen } from './selectors';
import { setSidebarOpen } from './slice';

export const toggleSidebar = (): AppThunk => (dispatch, getState) => {
  const isOpen = isSidebarOpen(getState());
  dispatch(setSidebarOpen(!isOpen));
};
