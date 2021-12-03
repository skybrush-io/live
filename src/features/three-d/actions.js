import { resetZoom as _resetZoom, rotateViewTowards } from './slice';

const setFocusToThreeDView = () => {
  // TODO(ntamas): focus on 3D view so the user can start using the keyboard
};

export const resetZoom = () => (dispatch) => {
  dispatch(_resetZoom());
  setFocusToThreeDView();
};

export const rotateViewToDrones = () => (dispatch, getState) => {
  const state = getState();
  const center = null; // TODO

  if (center) {
    dispatch(rotateViewTowards(center));
  }

  setFocusToThreeDView();
};
