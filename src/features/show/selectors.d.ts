import type {
  ShowSegment,
  SwarmSpecification,
  Trajectory,
} from '@skybrush/show-format';

import type { AppSelector, RootState } from '~/store/reducers';
import type { FlatEarthCoordinateSystem } from '~/utils/geography';
import type { Coordinate2D, WorldCoordinate2D } from '~/utils/math';
import type { EnvironmentState, OutdoorCoordinateSystem } from './types';

type ShowValidationResult =
  | 'loadingFailed'
  | 'notLoaded'
  | 'loading'
  | 'takeoffPositionsTooClose'
  | 'landingPositionsTooClose'
  | 'ok';

export const areManualPreflightChecksSignedOff: (state: RootState) => boolean;
export const areOnboardPreflightChecksSignedOff: (state: RootState) => boolean;
export const areStartConditionsSyncedWithServer: (state: RootState) => boolean;
export const didLastLoadingAttemptFail: (state: RootState) => boolean;
export const didStartConditionSyncFail: (state: RootState) => boolean;
export const getConvexHullOfShow: (state: RootState) => Coordinate2D[];
export const getMaximumHeightInTrajectories: (
  state: RootState
) => number | undefined;
export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories: (
  state: RootState
) => number | undefined;
export const getOutdoorShowToWorldCoordinateSystemTransformationObject: (
  state: RootState
) => FlatEarthCoordinateSystem | undefined;
export const getShowStartTimeAsString: (state: RootState) => string;
export const getEnvironmentState: AppSelector<EnvironmentState>;
export const getShowValidationResult: (
  state: RootState
) => ShowValidationResult;
export const getSwarmSpecification: AppSelector<SwarmSpecification | undefined>;
export const hasLoadedShowFile: (state: RootState) => boolean;
export const hasScheduledStartTime: (state: RootState) => boolean;
export const hasShowChangedExternallySinceLoaded: (state: RootState) => boolean;
export const hasShowOrigin: (state: RootState) => boolean;
export const isLoadingShowFile: (state: RootState) => boolean;
export const isShowAuthorizedToStart: (state: RootState) => boolean;
export const isShowAuthorizedToStartLocally: (state: RootState) => boolean;
export const isShowConvexHullInsideGeofence: (state: RootState) => boolean;
export const isShowIndoor: (state: RootState) => boolean;
export const isShowOutdoor: (state: RootState) => boolean;
export const isTakeoffAreaApproved: (state: RootState) => boolean;

export const getShowSegment: AppSelector<ShowSegment | undefined>;
export const getSwarmSpecificationForShowSegment: AppSelector<
  SwarmSpecification | undefined
>;
export const getShowSegmentTrajectories: AppSelector<
  (Trajectory | undefined)[]
>;
export const getConvexHullsOfShowSegmentTrajectories: AppSelector<
  Coordinate2D[][]
>;
export const getConvexHullOfShowSegment: AppSelector<Coordinate2D[]>;
export const getConvexHullOfShowSegmentInWorldCoordinates: AppSelector<
  WorldCoordinate2D[]
>;
export const getOutdoorShowCoordinateSystem: AppSelector<
  OutdoorCoordinateSystem | undefined
>;
