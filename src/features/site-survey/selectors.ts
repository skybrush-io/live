import { createSelector } from 'reselect';

import {
  getOutdoorShowCoordinateSystem as getOutdoorShowCoordinateSystemFromShow,
  getSwarmSpecificationForShowSegment as getSwarmSpecificationForShowSegmentFromShow,
} from '~/features/show/selectors';
import {
  makeSelectors as makeTrajectorySelectors,
  positionsToWorldCoordinatesCombiner,
} from '~/features/show/trajectory-selectors';
import { isOutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import type { AppSelector, RootState } from '~/store/reducers';
import { type Latitude, type Longitude } from '~/utils/geography';
import { EMPTY_ARRAY } from '~/utils/redux';

import type { ShowData, SiteSurveyState } from './state';

const _defaultCoordinateSystem: ShowData['coordinateSystem'] = {
  type: 'nwu',
  origin: [19.061951 as Longitude, 47.47334 as Latitude],
  orientation: '0',
};

const selectSiteSurveyState: AppSelector<SiteSurveyState> = (
  state: RootState
) => state.dialogs.siteSurvey;

const selectShowData = createSelector(
  selectSiteSurveyState,
  (state): ShowData =>
    state.showData ?? {
      // Provide a default instead of doing a ton of dealing with undefined everywhere.
      swarm: { drones: EMPTY_ARRAY },
      homePositions: EMPTY_ARRAY,
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
 * Selector that returns the home positions of drones from the site survey state.
 */
const getHomePositions = createSelector(
  selectShowData,
  (showData) => showData.homePositions
);

/**
 * Selector that returns the selection from the site survey state.
 */
export const getSelection = createSelector(
  selectSiteSurveyState,
  (state) => state.selection
);

/**
 * Selector that returns the show data from the currently loaded show.
 */
export const selectSiteSurveyDataFromShow: AppSelector<ShowData | undefined> =
  createSelector(
    getSwarmSpecificationForShowSegmentFromShow,
    getOutdoorShowCoordinateSystemFromShow,
    (showSwarm, showCoordinateSystem) => {
      if (
        showSwarm === undefined ||
        showCoordinateSystem === undefined ||
        !isOutdoorCoordinateSystemWithOrigin(showCoordinateSystem)
      ) {
        return undefined;
      }

      return {
        swarm: showSwarm,
        coordinateSystem: showCoordinateSystem,
        homePositions: showSwarm.drones.map((drone) => drone.settings?.home),
      };
    }
  );

export const {
  getConvexHullOfShow,
  getConvexHullOfShowInWorldCoordinates,
  getConvexHullsOfTrajectories,
  getDroneSpecifications,
  getHomePositions: getDefaultHomePositions,
  getHomePositionsInWorldCoordinates: getDefaultHomePositionsInWorldCoordinates,
  getLandingPositionsInWorldCoordinates,
  getOutdoorShowToWorldCoordinateSystemTransformation,
} = makeTrajectorySelectors(selectSwarmSpecification, selectCoordinateSystem);

export const getHomePositionsInWorldCoordinates = createSelector(
  getHomePositions,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  positionsToWorldCoordinatesCombiner
);
