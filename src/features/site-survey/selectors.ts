import { createSelector } from 'reselect';

import { SwarmSpecification } from '@skybrush/show-format';

import {
  getOutdoorShowCoordinateSystem as getOutdoorShowCoordinateSystemFromShow,
  getSwarmSpecificationForShowSegment as getSwarmSpecificationForShowSegmentFromShow,
} from '~/features/show/selectors';
import { makeSelectors as makeTrajectorySelectors } from '~/features/show/trajectory-selectors';
import { isOutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import type { AppSelector, RootState } from '~/store/reducers';
import { EMPTY_ARRAY } from '~/utils/redux';

import type { ShowData, SiteSurveyState } from './state';

const _defaultCoordinateSystem: ShowData['coordinateSystem'] = {
  type: 'nwu',
  origin: [19.061951, 47.47334],
  orientation: '0',
};
const _defaultSwarm: SwarmSpecification = {
  drones: EMPTY_ARRAY,
};

const selectSiteSurveyState: AppSelector<SiteSurveyState> = (
  state: RootState
) => state.dialogs.siteSurvey;

const selectShowData = createSelector(
  selectSiteSurveyState,
  (state): ShowData =>
    state.showData ?? {
      // Provide a default instead of doing a ton of dealing with undefined everywhere.
      swarm: _defaultSwarm,
      coordinateSystem: _defaultCoordinateSystem,
    }
);

/**
 * Selector that returns the coordinate system from the site survey state.
 */
export const selectCoordinateSystem = createSelector(
  selectShowData,
  (showData) => showData.coordinateSystem
);

/**
 * Selector that returns the swarm specification from the site survey state.
 */
const selectSwarmSpecification = createSelector(
  selectShowData,
  (showData) => showData.swarm
);

/**
 * Selector that returns the selection from the site survey state.
 */
export const getSelection = createSelector(
  selectSiteSurveyState,
  (state) => state.selection
);

/**
 * Data sources that can be used to initialize the dialog.
 */
export type DataSources = {
  /** Show data from the currently loaded show. */
  show?: ShowData;
};

/**
 * Selector that returns the data sources the dialog can be initialized with.
 */
export const selectInitDataSources: AppSelector<DataSources> = createSelector(
  getSwarmSpecificationForShowSegmentFromShow,
  getOutdoorShowCoordinateSystemFromShow,
  (showSwarm, showCoordinateSystem) => {
    const show: ShowData | undefined =
      showSwarm === undefined ||
      showCoordinateSystem === undefined ||
      !isOutdoorCoordinateSystemWithOrigin(showCoordinateSystem)
        ? undefined
        : {
            swarm: showSwarm,
            coordinateSystem: showCoordinateSystem,
          };

    return { show };
  }
);

export const {
  getConvexHullOfShow,
  getConvexHullOfShowInWorldCoordinates,
  getConvexHullsOfTrajectories,
  getDroneSpecifications,
  getHomePositionsInWorldCoordinates,
  getLandingPositionsInWorldCoordinates,
} = makeTrajectorySelectors(selectSwarmSpecification, selectCoordinateSystem);
