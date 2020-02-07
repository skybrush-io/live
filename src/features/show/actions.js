import get from 'lodash-es/get';
import pMinDelay from 'p-min-delay';

import { loadShowFromFile as processFile } from './processing';
import { setEnvironmentType } from './slice';

import { setMappingLength } from '~/features/mission/slice';
import { showSnackbarMessage } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import { createAsyncAction } from '~/utils/redux';

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
  let result;

  try {
    result = await dispatch(loadShowFromFileInner(file));
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

  const spec = result.value;
  const drones = get(spec, 'swarm.drones');
  dispatch(setMappingLength(drones.length));

  const environment = get(spec, 'environment');
  if (environment.type) {
    dispatch(setEnvironmentType(environment.type));
  }
};
