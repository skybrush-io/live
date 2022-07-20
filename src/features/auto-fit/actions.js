import { recalculateMapping } from '~/features/mission/actions';
import { updateOutdoorShowSettings } from '~/features/show/actions';
import { showErrorMessage } from '../error-handling/actions';

import { estimateShowCoordinateSystem } from './algorithm';
import {
  canEstimateShowCoordinateSystemFromActiveUAVs,
  getShowCoordinateSystemFittingProblemFromState,
} from './selectors';

/**
 * Action thunk that estimates the coordinate system of the show based on the
 * current positions of the active UAVs.
 */
export function estimateShowCoordinateSystemFromActiveUAVs() {
  return (dispatch, getState) => {
    const state = getState();

    if (!canEstimateShowCoordinateSystemFromActiveUAVs(state)) {
      return;
    }

    const problem = getShowCoordinateSystemFittingProblemFromState(state);
    let result;

    try {
      result = estimateShowCoordinateSystem(problem);
    } catch (error) {
      dispatch(
        showErrorMessage('Failed to calculate show coordinate system', error)
      );
      return;
    }

    const { origin, orientation } = result;

    dispatch(
      updateOutdoorShowSettings({
        origin,
        orientation: orientation.toFixed(1),
        setupMission: true,
      })
    );

    dispatch(recalculateMapping());
  };
}
