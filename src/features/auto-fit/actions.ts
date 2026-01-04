import { errorToString } from '~/error-handling';
import { showErrorMessage } from '~/features/error-handling/actions';
import { updateFlatEarthCoordinateSystem } from '~/features/map/origin';
import { recalculateMapping } from '~/features/mission/actions';
import {
  setOutdoorShowAltitudeReferenceToAverageAMSL,
  updateOutdoorShowSettings,
} from '~/features/show/actions';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';
import type { AppThunk } from '~/store/reducers';
import { createAsyncAction } from '~/utils/redux';
import workers from '~/workers';

import {
  canEstimateShowCoordinateSystemFromActiveUAVs,
  getShowCoordinateSystemFittingProblemFromState,
} from './selectors';
import type {
  CoordinateSystemEstimate,
  CoordinateSystemFittingProblem,
} from './types';

type DoEsimateArgs = {
  problem: CoordinateSystemFittingProblem;
  result?: CoordinateSystemEstimate;
};

const doEstimate = createAsyncAction(
  'show/coordinateSystemEstimation',
  async (args: DoEsimateArgs) => {
    const { problem } = args;
    args.result = await workers.estimateShowCoordinateSystem(problem);
  }
);

/**
 * Action thunk that estimates the coordinate system of the show based on the
 * current positions of the active UAVs.
 */
export function estimateShowCoordinateSystemFromActiveUAVs(): AppThunk {
  return async (dispatch, getState) => {
    const state = getState();

    if (!canEstimateShowCoordinateSystemFromActiveUAVs(state)) {
      return;
    }

    const args: DoEsimateArgs = {
      problem: getShowCoordinateSystemFittingProblemFromState(state),
      result: undefined,
    };

    try {
      await dispatch(doEstimate(args));
    } catch (error) {
      console.error(error);
      console.log('Problem description:', args.problem);
      dispatch(
        showErrorMessage(
          errorToString(error, 'Failed to calculate show coordinate system')
        )
      );
      return;
    }

    const { origin, orientation, type } = args.result!;

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
