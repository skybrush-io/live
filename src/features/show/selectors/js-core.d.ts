import type {
  ShowSegment,
  SwarmSpecification,
  Trajectory,
} from '@skybrush/show-format';

import type { GPSPosition } from '~/model/geography';
import type { AppSelector, RootState } from '~/store/reducers';
import type { FlatEarthCoordinateSystem } from '~/utils/geography';
import type { Coordinate2D, Coordinate3D } from '~/utils/math';

import type { ShowValidationResult } from './types';

export const getConvexHullOfShow: AppSelector<Coordinate2D[]>;
export const getConvexHullOfShowInWorldCoordinates: AppSelector<GPSPosition[]>;

export const getFirstPointsOfTrajectories: AppSelector<
  Array<Coordinate3D | undefined>
>;

export const getFirstPointsOfTrajectoriesInWorldCoordinates: AppSelector<
  Array<GPSPosition | undefined>
>;

export const getLastPointsOfTrajectoriesInWorldCoordinates: AppSelector<
  Array<GPSPosition | undefined>
>;

export const getMaximumHeightInTrajectories: (
  state: RootState
) => number | undefined;

export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories: (
  state: RootState
) => number | undefined;

export const getOutdoorShowToWorldCoordinateSystemTransformation: AppSelector<
  ((coords: Coordinate3D) => GPSPosition) | undefined
>;

export const getOutdoorShowToWorldCoordinateSystemTransformationObject: (
  state: RootState
) => FlatEarthCoordinateSystem | undefined;

export const getShowStartTimeAsString: (state: RootState) => string;

export const getShowToFlatEarthCoordinateSystemTransformation: AppSelector<
  ((coords: Coordinate3D) => Coordinate3D) | undefined
>;

export const getShowValidationResult: (
  state: RootState
) => ShowValidationResult;

export const isShowConvexHullInsideGeofence: (state: RootState) => boolean;

export const getTrajectoryPointsInWorldCoordinatesByMissionIndex: (
  state: RootState,
  missionIndex: number
) => GPSPosition[] | undefined;

export const getShowSegment: AppSelector<ShowSegment | undefined>;
export const getSwarmSpecificationForShowSegment: AppSelector<
  SwarmSpecification | undefined
>;
export const getShowSegmentTrajectories: AppSelector<
  Array<Trajectory | undefined>
>;
export const getConvexHullsOfShowSegmentTrajectories: AppSelector<
  Coordinate2D[][]
>;
export const getConvexHullOfShowSegment: AppSelector<Coordinate2D[]>;
export const getConvexHullOfShowSegmentInWorldCoordinates: AppSelector<
  GPSPosition[]
>;
