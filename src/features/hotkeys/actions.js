import { showNotification } from '~/features/snackbar/slice';
import { copyDisplayedCoordinatesToClipboard } from '~/views/map/utils';

/**
 * Thunk action that copies the currently displayed map coordinates to the
 * clipboard and then shows a notification to the user.
 */
export const copyCoordinates = () => (dispatch) => {
  if (copyDisplayedCoordinatesToClipboard()) {
    dispatch(showNotification('Coordinates copied to clipboard.'));
  } else {
    dispatch(
      showNotification({
        message: 'Failed to copy coordinates; are you hovering over the map?',
        semantics: 'error',
      })
    );
  }
};
