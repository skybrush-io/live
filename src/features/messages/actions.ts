import { getSingleSelectedUAVId } from '~/features/uavs/selectors';
import type { AppThunk } from '~/store/reducers';

import { clearMessagesOfUAVById } from './slice';

export const clearMessagesOfSelectedUAV =
  (): AppThunk => (dispatch, getState) => {
    const uavId = getSingleSelectedUAVId(getState());

    if (uavId) {
      dispatch(clearMessagesOfUAVById(uavId));
    }
  };
