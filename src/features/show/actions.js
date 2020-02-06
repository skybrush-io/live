import pMinDelay from 'p-min-delay';

import { loadShowFromFile as processFile } from './processing';
import { createAsyncAction } from '~/utils/redux';

import { showSnackbarMessage } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';

const loadShowFromFileInner = createAsyncAction('show/loading', async file => {
  return pMinDelay(processFile(file), 500);
});

/**
 * Thunk that creates an async action that loads a drone show from a Skybrush
 * compiled drone show file.
 *
 * The thunk must be invoked with the file that the user wants to open
 * the show from.
 */
export const loadShowFromFile = file => async dispatch => {
  try {
    await dispatch(loadShowFromFileInner(file));
  } catch (error) {
    dispatch(
      showSnackbarMessage({
        message: 'Failed to load show from the given file.',
        semantics: MessageSemantics.ERROR,
        permanent: true
      })
    );
    console.error(error);
  }
};
