import type {
  Environment,
  ShowSegment,
  ShowSegmentId,
  SwarmSpecification,
  Trajectory,
  ValidationSettings,
} from '@skybrush/show-format';

import type { GPSPosition } from '~/model/geography';
import type { AppSelector, RootState } from '~/store/reducers';
import type { FlatEarthCoordinateSystem } from '~/utils/geography';
import type { Coordinate2D } from '~/utils/math';

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
export const countUAVsTakingOffAutomatically: (state: RootState) => number;
export const didLastLoadingAttemptFail: (state: RootState) => boolean;
export const didStartConditionSyncFail: (state: RootState) => boolean;
export const getConvexHullOfShow: (state: RootState) => Coordinate2D[];
export const getEnvironmentFromLoadedShowData: AppSelector<
  Environment | undefined
>;
export const getEnvironmentState: AppSelector<EnvironmentState>;
export const getMaximumHeightInTrajectories: (
  state: RootState
) => number | undefined;
export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories: (
  state: RootState
) => number | undefined;
export const getOutdoorShowOrigin: AppSelector<
  OutdoorCoordinateSystem['origin']
>;
export const getOutdoorShowToWorldCoordinateSystemTransformationObject: (
  state: RootState
) => FlatEarthCoordinateSystem | undefined;
export const getShowSegments: AppSelector<
  Partial<Record<ShowSegmentId, ShowSegment>> | undefined
>;
export const getShowStartTimeAsString: (state: RootState) => string;
export const getShowValidationResult: (
  state: RootState
) => ShowValidationResult;
export const getShowValidationSettings: AppSelector<
  ValidationSettings | undefined
>;
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

export const getBase64ShowBlob: AppSelector<string | undefined>;
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
export const getOutdoorShowCoordinateSystem: AppSelector<OutdoorCoordinateSystem>;
