import { showErrorMessage } from '~/features/error-handling/actions';
import { updateFlatEarthCoordinateSystem } from '~/features/map/origin';
import { recalculateMapping } from '~/features/mission/actions';
import {
  setOutdoorShowAltitudeReferenceToAverageAMSL,
  updateOutdoorShowSettings,
} from '~/features/show/actions';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';

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

    let result;

    try {
      const problem = getShowCoordinateSystemFittingProblemFromState(state);
      result = estimateShowCoordinateSystem(problem);
    } catch (error) {
      console.error(error);
      dispatch(
        showErrorMessage('Failed to calculate show coordinate system', error)
      );
      return;
    }

    const { origin, orientation, type } = result;

    dispatch(
      updateOutdoorShowSettings({
        origin,
        orientation: orientation.toFixed(1),
        setupMission: true,
      })
    );

    dispatch(setOutdoorShowAltitudeReferenceToAverageAMSL());
    dispatch(recalculateMapping());

    if (!isMapCoordinateSystemSpecified(getState())) {
      /* To make the life of the user easier at first setup, let us put the origin
       * of the map coordinate system to where the show coordinate system is */
      dispatch(
        updateFlatEarthCoordinateSystem({
          position: origin,
          angle: orientation.toFixed(1),
          type,
        })
      );
    }
  };
}
