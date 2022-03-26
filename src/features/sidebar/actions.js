import { isSidebarOpen } from './selectors';
import { setSidebarOpen } from './slice';

/**
 * Dispatches an action that opens the sidebar if it is closed and closes it if
 * it is open.
 */
export function toggleSidebar() {
  return (dispatch, getState) => {
    const isOpen = isSidebarOpen(getState());
    dispatch(setSidebarOpen(!isOpen));
  };
}
