import { boundingExtent } from 'ol/extent';
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
import { type GPSPosition } from '~/model/geography';
import type { AppSelector, RootState } from '~/store/reducers';
import type { Latitude, Longitude, LonLat } from '~/utils/geography';
import { convexHull2D, type Coordinate2D, getCentroid } from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

import type { AdaptResult, ShowData, SiteSurveyState } from './state';

const _defaultCoordinateSystem: ShowData['coordinateSystem'] = {
  type: 'nwu',
  origin: [19.061951 as Longitude, 47.47334 as Latitude],
  orientation: '0',
};

const selectSiteSurveyState: AppSelector<SiteSurveyState> = (
  state: RootState
) => state.dialogs.siteSurvey;

export const isSiteSurveyDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.siteSurvey.open;

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
export const getHomePositions = createSelector(
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
 * Selector that returns the partial show data from the currently loaded show.
 *
 * This is useful for showing feedback to the user about what's missing but necessary
 * to use the site survey dialog.
 */
export const selectPartialSiteSurveyDataFromShow: AppSelector<
  Partial<ShowData>
> = createSelector(
  getSwarmSpecificationForShowSegmentFromShow,
  getOutdoorShowCoordinateSystemFromShow,
  (showSwarm, showCoordinateSystem) => {
    return {
      swarm: showSwarm,
      coordinateSystem:
        showCoordinateSystem &&
        isOutdoorCoordinateSystemWithOrigin(showCoordinateSystem)
          ? showCoordinateSystem
          : undefined,
      homePositions: showSwarm?.drones.map((drone) => drone.settings?.home),
    };
  }
);

/**
 * Selector that returns the show data from the currently loaded show.
 */
export const selectSiteSurveyDataFromShow: AppSelector<ShowData | undefined> =
  createSelector(
    selectPartialSiteSurveyDataFromShow,
    ({ swarm, coordinateSystem, homePositions }) => {
      if (
        swarm === undefined ||
        coordinateSystem === undefined ||
        homePositions === undefined
      ) {
        return undefined;
      }

      return { swarm, coordinateSystem, homePositions };
    }
  );

export const selectIsShowAdaptInProgress: AppSelector<boolean> = createSelector(
  selectSiteSurveyState,
  (state) =>
    state.adaptResult !== undefined &&
    'loading' in state.adaptResult &&
    state.adaptResult.loading // Just to be safe.
);

export const selectShowAdaptError: AppSelector<string | undefined> =
  createSelector(selectSiteSurveyState, (state) =>
    state.adaptResult !== undefined && 'error' in state.adaptResult
      ? state.adaptResult.error
      : undefined
  );

export const selectAdaptResult: AppSelector<AdaptResult | undefined> =
  createSelector(selectSiteSurveyState, (state) =>
    state.adaptResult !== undefined && 'show' in state.adaptResult
      ? state.adaptResult
      : undefined
  );

export const selectAdaptedShowAsBase64String: AppSelector<string | undefined> =
  createSelector(selectAdaptResult, (result) => result?.show);

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

export type ConvexHullMarkerData = {
  orientation: number;
  origin: LonLat;
};

export const selectConvexHullMarkerData: AppSelector<
  ConvexHullMarkerData | undefined
> = createSelector(
  selectCoordinateSystem,
  getConvexHullOfShow,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  (coordinateSystem, convexHull, transform) => {
    if (transform === undefined) {
      return undefined;
    }

    const extent = boundingExtent(convexHull);
    const x = extent[0]! + (extent[2]! - extent[0]!) / 2;
    const y = extent[1]! + (extent[3]! - extent[1]!) / 2;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return undefined;
    }

    const coords = transform([x, y]);
    return {
      orientation: Number.parseFloat(coordinateSystem.orientation),
      origin: [coords.lon, coords.lat] as LonLat,
    };
  }
);

export const getHomePositionsInWorldCoordinates = createSelector(
  getHomePositions,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  positionsToWorldCoordinatesCombiner
);

export const getCenterOfSiteSurveyHomePositionsInWorldCoordinates: AppSelector<
  GPSPosition | undefined
> = createSelector(getHomePositionsInWorldCoordinates, (homePositions) => {
  if (homePositions) {
    const [lon, lat] = getCentroid(homePositions.map((p) => [p.lon, p.lat]));
    return { lon, lat };
  }
});

const selectApproximateConvexHullOfFullShow = createSelector(
  getConvexHullOfShow,
  getHomePositions,
  (convexHull, homePositions) =>
    convexHull2D([
      ...convexHull,
      ...homePositions
        .filter((p) => p !== undefined)
        .map((p): Coordinate2D => [p[0], p[1]]),
    ])
);

export const selectApproximateConvexHullOfFullShowInWorldCoordinates =
  createSelector(
    selectApproximateConvexHullOfFullShow,
    getOutdoorShowToWorldCoordinateSystemTransformation,
    positionsToWorldCoordinatesCombiner
  );
