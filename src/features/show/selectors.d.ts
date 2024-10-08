import type { RootState } from '~/store/reducers';

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
export const getShowValidationResult: (
  state: RootState
) => ShowValidationResult;
export const hasLoadedShowFile: (state: RootState) => boolean;
export const hasScheduledStartTime: (state: RootState) => boolean;
export const hasShowChangedExternallySinceLoaded: (state: RootState) => boolean;
export const hasShowOrigin: (state: RootState) => boolean;
export const getShowStartTimeAsString: (state: RootState) => string;
export const isLoadingShowFile: (state: RootState) => boolean;
export const isShowAuthorizedToStart: (state: RootState) => boolean;
export const isShowAuthorizedToStartLocally: (state: RootState) => boolean;
export const isShowConvexHullInsideGeofence: (state: RootState) => boolean;
export const isShowIndoor: (state: RootState) => boolean;
export const isShowOutdoor: (state: RootState) => boolean;
export const isTakeoffAreaApproved: (state: RootState) => boolean;
