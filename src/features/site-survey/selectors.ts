import { createSelector } from 'reselect';

import { SwarmSpecification } from '@skybrush/show-format';

import {
  getEnvironmentState,
  getSwarmSpecificationForShowSegment,
} from '~/features/show/selectors';
import { makeSelectors as makeTrajectorySelectors } from '~/features/show/trajectory-selectors';
import type { EnvironmentState } from '~/features/show/types';
import type { AppSelector, RootState } from '~/store/reducers';
import type { SiteSurveyState } from './dialog';

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

export type DataSources = {
  swarm: {
    /** The swarm specification of the currently loaded show. */
    show?: SwarmSpecification;
  };
};

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
