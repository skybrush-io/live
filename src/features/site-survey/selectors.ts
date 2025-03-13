import { createSelector } from 'reselect';

import { SwarmSpecification } from '@skybrush/show-format';

import {
  getEnvironmentState,
  getSwarmSpecificationForShowSegment,
} from '~/features/show/selectors';
import { makeSelectors as makeTrajectorySelectors } from '~/features/show/trajectory-selectors';
import type { EnvironmentState } from '~/features/show/types';
import type { AppSelector, RootState } from '~/store/reducers';

import type { SiteSurveyState } from './state';

const selectSiteSurveyState: AppSelector<SiteSurveyState> = (
  state: RootState
) => state.dialogs.siteSurvey;

/**
 * Selector that returns the swarm specification from the site survey state.
 */
const selectSwarmSpecification = createSelector(
  selectSiteSurveyState,
  (state) => state.swarm ?? { drones: [] }
);

/**
 * Environment selector.
 *
 * Use the same environment state as the show.
 */
const selectEnvironment: AppSelector<EnvironmentState> = getEnvironmentState;

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
  swarm: {
    /** The swarm specification of the currently loaded show. */
    show?: SwarmSpecification;
  };
};

/**
 * Selector that returns the data sources the dialog can be initialized with.
 */
export const selectDataSources: AppSelector<DataSources> = createSelector(
  getSwarmSpecificationForShowSegment,
  (showSwarm) => ({
    swarm: {
      show: showSwarm,
    },
  })
);

export const {
  getConvexHullOfShow,
  getConvexHullOfShowInWorldCoordinates,
  getConvexHullsOfTrajectories,
  getDroneSpecifications,
  getHomePositionsInWorldCoordinates,
  getLandingPositionsInWorldCoordinates,
  getOutdoorShowCoordinateSystem,
} = makeTrajectorySelectors(selectSwarmSpecification, selectEnvironment);
