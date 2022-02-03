import { getSingleSelectedUAVId } from '~/features/uavs/selectors';

import { clearMessagesOfUAVById } from './slice';

export function clearMessagesOfSelectedUAV() {
  return (dispatch, getState) => {
    const uavId = getSingleSelectedUAVId(getState());

    if (uavId) {
      dispatch(clearMessagesOfUAVById(uavId));
    }
  };
}
