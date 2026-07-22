import { Base64 } from 'js-base64';
import ky from 'ky';
import sum from 'lodash-es/sum';
import throttle from 'lodash-es/throttle';
import Point from 'ol/geom/Point';

import { freeze } from '@reduxjs/toolkit';

import { toRadians } from '@skybrush/math';
import {
  EnvironmentType,
  loadShowSpecificationAndZip as processFile,
  type ShowSpecification,
} from '@skybrush/show-format';

import { getFeaturesInOrder } from '~/features/map-features/selectors';
import { removeFeaturesByIds } from '~/features/map-features/slice';
import {
  ensureMissionType,
  setMappingLength,
} from '~/features/mission/actions';
import {
  setCommandsAreBroadcast,
  setMissionType,
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
} from '~/features/mission/slice';
import { showConfirmationDialog } from '~/features/prompt/actions';
import type { PromptResponse } from '~/features/prompt/types';
import { getUAVOperationConfirmationStyle } from '~/features/settings/selectors';
import { showError, showSuccess } from '~/features/snackbar/actions';
import {
  getActiveUAVIds,
  getCurrentGPSPositionByUavId,
} from '~/features/uavs/selectors';
import { clearUploadHistoryForJobType } from '~/features/upload/slice';
import i18n from '~/i18n';
import messageHub from '~/message-hub';
import { MissionType } from '~/model/missions';
import { UAVOperationConfirmationStyle } from '~/model/settings';
import type { AppDispatch, AppThunk, RootState } from '~/store/reducers';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  translateLonLatWithMapViewDelta,
  type EasNor,
  type LonLat,
} from '~/utils/geography';
import type { Coordinate3D } from '~/utils/math';
import { createAsyncAction } from '~/utils/redux';
import workers from '~/workers';

import {
  JOB_TYPE,
  type AltitudeReference,
  type TakeoffHeadingSpecification,
} from './constants';
import { StartMethod } from './enums';
import {
  getAbsolutePathOfShowFile,
  getCommonTakeoffHeading,
  getFirstPointsOfTrajectoriesInWorldCoordinates,
  getLastPointsOfTrajectoriesInWorldCoordinates,
  getOutdoorShowAltitudeReference,
  getOutdoorShowOrientation,
  getOutdoorShowOrigin,
  getRoomCorners,
  getShowClockReference,
  hasScheduledStartTime,
  selectIsCollectiveRTHTriggered,
} from './selectors';
import {
  _clearLoadedShow,
  _setOutdoorShowAltitudeReference,
  approveTakeoffAreaAt,
  loadingProgress,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setLastLoadingAttemptFailed,
  setOutdoorShowOrientation,
  setOutdoorShowOrigin,
  setOutdoorShowTakeoffHeadingSpecification,
  setRoomCorners,
  setShowAuthorization,
  setShowControlSchedule,
  setStartMethod,
  setStartTime,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  synchronizeShowSettings,
} from './slice';

/**
 * Thunk that approves the takeoff area arrangement with the current timestamp.
 */
export const approveTakeoffArea = (): AppThunk => (dispatch) => {
  dispatch(approveTakeoffAreaAt(Date.now()));
};

/**
 * Thunk that authorizes the start of the show if it has a scheduled start time
 * and deauthorizes it if it does not have a scheduled start time.
 */
export const authorizeIfAndOnlyIfHasStartTime =
  (): AppThunk => (dispatch, getState) => {
    const shouldAuthorize = hasScheduledStartTime(getState());
    dispatch(setShowAuthorization(shouldAuthorize));
    if (shouldAuthorize) {
      dispatch(setCommandsAreBroadcast(true));
    }
  };

/**
 * Returns an action that clears the upload history of the show upload job.
 */
const clearShowUploadResult = () => clearUploadHistoryForJobType(JOB_TYPE);

/**
 * Thunk that clears the currently loaded show and sets the type of the
 * currently loaded mission to unknown.
 */
export const clearLoadedShow = (): AppThunk => (dispatch) => {
  dispatch(_clearLoadedShow());
  dispatch(setMissionType(MissionType.UNKNOWN));
};

/**
 * Think that clears the start time of the show, keeping its start method.
 */
export const clearStartTime = (): AppThunk => (dispatch, getState) => {
  const clock = getShowClockReference(getState());
  dispatch(setStartTime({ clock, time: undefined }));
  dispatch(synchronizeShowSettings('toServer'));
};

/**
 * Updates the takeoff and landing positions and the takeoff headings in the
 * current mission from the show settings and trajectories.
 */
export const setupMissionFromShow = (): AppThunk => (dispatch, getState) => {
  const state = getState();

  // TODO(ntamas): map these to GPS coordinates only if the show is outdoor
  const homePositions = getFirstPointsOfTrajectoriesInWorldCoordinates(
    state
  ).map((pos) => pos ?? null);
  const landingPositions = getLastPointsOfTrajectoriesInWorldCoordinates(
    state
  ).map((pos) => pos ?? null);
  const takeoffHeading = getCommonTakeoffHeading(state) ?? null;

  dispatch(ensureMissionType(MissionType.SHOW));
  dispatch(updateHomePositions(homePositions));
  dispatch(updateLandingPositions(landingPositions));
  dispatch(updateTakeoffHeadings(takeoffHeading));
};

export const removeShowFeatures = (): AppThunk => (dispatch, getState) => {
  const state = getState();

  const showFeatureIds = getFeaturesInOrder(state)
    .filter((feature) => feature.owner === 'show')
    .map((feature) => feature.id);

  dispatch(removeFeaturesByIds(showFeatureIds));
};

/**
 * Moves the show origin relative to its current position such that the delta
 * is expressed in map view coordinates.
 */
export const moveOutdoorShowOriginByMapCoordinateDelta =
  (delta: EasNor): AppThunk =>
  (dispatch, getState) => {
    const origin = getOutdoorShowOrigin(getState());
    if (origin) {
      const newOrigin = translateLonLatWithMapViewDelta(origin, delta);
      dispatch(
        updateOutdoorShowSettings({ origin: newOrigin, setupMission: true })
      );
    } else {
      console.warn('Cannot move outdoor show origin because it is not set.');
    }
  };

/**
 * Rotates the show origin by the given angle in degrees, snapping to one
 * decimal digit.
 */
export const rotateOutdoorShowOrientationByAngle =
  (delta: number): AppThunk =>
  (dispatch, getState) => {
    const orientation = getOutdoorShowOrientation(getState());
    const newOrientation = orientation + delta;

    if (Number.isFinite(newOrientation)) {
      dispatch(
        updateOutdoorShowSettings({
          orientation: newOrientation.toFixed(1),
          setupMission: true,
        })
      );
    }
  };

/**
 * Rotates the show origin by the given angle in degrees around a given point,
 * snapping the angle to one decimal digit.
 */
export const rotateOutdoorShowOrientationByAngleAroundPoint =
  (angle: number, rotationOriginInMapCoordinates: EasNor): AppThunk =>
  (dispatch, getState) => {
    const origin = getOutdoorShowOrigin(getState());
    if (!origin) {
      console.warn(
        'Cannot rotate outdoor show orientation around point because ' +
          'the origin is not set.'
      );
      return;
    }

    const showOriginInMapCoordinates = mapViewCoordinateFromLonLat(origin);
    const showOriginPoint = new Point(showOriginInMapCoordinates);
    showOriginPoint.rotate(toRadians(-angle), rotationOriginInMapCoordinates);
    const newOrigin = lonLatFromMapViewCoordinate(
      showOriginPoint.getCoordinates() as EasNor
    );

    dispatch(setOutdoorShowOrigin(newOrigin));
    dispatch(rotateOutdoorShowOrientationByAngle(angle));
  };

type OutdoorShowSettings = Partial<{
  origin: LonLat;
  orientation: number | string;
  takeoffHeading: TakeoffHeadingSpecification;
  setupMission: boolean;
}>;

export const updateOutdoorShowSettings =
  (payload: OutdoorShowSettings): AppThunk =>
  (dispatch) => {
    const { origin, orientation, takeoffHeading, setupMission } = payload;
    let changed = false;

    if (origin) {
      dispatch(setOutdoorShowOrigin(origin));
      changed = true;
    }

    if (orientation) {
      dispatch(setOutdoorShowOrientation(orientation));
      changed = true;
    }

    if (takeoffHeading) {
      dispatch(setOutdoorShowTakeoffHeadingSpecification(takeoffHeading));
      changed = true;
    }

    if (changed) {
      dispatch(clearShowUploadResult());

      if (setupMission) {
        dispatch(setupMissionFromShow());
      }
    }
  };

/**
 * Object encapsulating a show specification, a URL that indicates where it was loaded
 * from (if known), and an optional base64 blob representation of the show specification
 * for cases when it needs to be kept around in unchanged form (such as when doing
 * show adaptation -- we want to pass the original show blob to the server).
 */
type ShowLoadResult = {
  spec: ShowSpecification;
  url?: string;
  base64Blob?: string;
};

/**
 * Type specification for the first argument of the `createShowLoaderThunkFactory()`
 * function. See its documentation for more details.
 */
type ShowLoaderDataSource<T> = (
  source: T,
  context: {
    dispatch: AppDispatch;
    getState: () => RootState;
    onProgress: (progress: number) => void;
  }
) => Promise<ShowLoadResult>;

/**
 * Internal factory function that creates Redux action factories for loading a show from
 * a given data source.
 *
 * @param dataSourceToShowSpecification - function that takes the data source (provided
 *        by the user as the first argument to the action factory) and asynchronously
 *        returns a show specification in JSON format, along with an optional URL that
 *        the show can be retrieved from and an optional base64 string representation of
 *        the raw binary show file. The second argument of this function provides access
 *        to the `dispatch()` and `getState()` functions of the Redux store, as well as
 *        a callback that can be used to report progress of the loading process.
 * @param options - options that modify certain aspects of the behaviour of the action
 *        factory. Currently it allows the caller to specify a custom error message that
 *        will be shown to the user if an error occurs during the loading process.
 *
 * @returns a function that takes the data source (of type `TArg`) and returns a Redux
 *          thunk that performs the show loading process when dispatched.
 */
const createShowLoaderThunkFactory = <T>(
  dataSourceToShowSpecification: ShowLoaderDataSource<T>,
  options: { errorMessage?: string } = {}
) => {
  const { errorMessage } = options;

  /**
   * First, format-specific step of the show loading process that takes a show
   * file from some data source (given as input arguments), and converts it
   * into JSON format, resolving JSON references where needed so we have a
   * single JSON object in the end.
   */
  const actionFactory = createAsyncAction(
    'show/loading',
    dataSourceToShowSpecification,
    { minDelay: 500 }
  );

  return (arg: T): AppThunk =>
    async (dispatch, getState) => {
      const onProgress = throttle((progress: number) => {
        dispatch(loadingProgress(progress));
      }, 200);

      dispatch(setLastLoadingAttemptFailed(false));
      dispatch(clearShowUploadResult());

      try {
        const result = await (dispatch(
          actionFactory(arg, { dispatch, getState, onProgress })
        ) as unknown as Promise<{ value: ShowLoadResult }>);
        processShowInJSONFormatAndDispatchActions(result.value.spec, dispatch);
      } catch (error) {
        showError(errorMessage || 'Failed to load show.', { permanent: true });
        dispatch(setLastLoadingAttemptFailed(true));
        console.error(error);
      }
    };
};

/** Type alias for blobs extended with an optional full path and filename */
type FileLike = Blob & { path?: string; name?: string };

/**
 * Thunk that creates an async action that loads a drone show from a Skybrush
 * compiled drone show file.
 *
 * The thunk must be invoked with the file that the user wants to open
 * the show from.
 */
export const loadShowFromFile = createShowLoaderThunkFactory(
  async (file: FileLike) => {
    const url = file.path ? `file://${file.path}` : undefined;
    const { spec, blob } = await workers.loadShow(file, {
      returnBlob: true,
    });

    // Base64-encode the blob so we can store it in the Redux store without
    // the serializable middleware yelling at us
    const base64Blob = blob ? Base64.fromUint8Array(blob) : undefined;

    // Pre-freeze the show data shallowly to give a hint to Redux Toolkit that
    // the show content won't change
    return { spec: Object.freeze(spec), url, base64Blob };
  },
  {
    errorMessage: 'Failed to load show from the given file.',
  }
);

/**
 * Thunk that creates an async action that loads a drone show from a base64-encoded
 * string representing a Skybrush compiled drone show file.
 *
 * The thunk must be invoked with the base64-encoded string that contains the show.
 */
export const loadBase64EncodedShow = createShowLoaderThunkFactory(
  async (base64Blob: string) => {
    // TODO(ntamas): The input is an Uint8Array; it would be more efficient to
    // use a transferable to send it to the web worker instead of copying it.
    // This will require modifications in workers.loadShow() in the future so
    // it wraps Uint8Array inputs in a transferable
    const { spec } = await workers.loadShow(Base64.toUint8Array(base64Blob), {
      returnBlob: false,
    });
    // Pre-freeze the show data shallowly to give a hint to Redux Toolkit that
    // the show content won't change
    return { spec: Object.freeze(spec), base64Blob };
  },
  {
    errorMessage: 'Failed to load show from the given base64-encoded data.',
  }
);

/**
 * Thunk that creates an async action that loads a drone show from a Skybrush
 * compiled drone show file provided at a remote URL.
 *
 * The thunk must be invoked with the URL that the user wants to open
 * the show from.
 */
export const loadShowFromUrl = createShowLoaderThunkFactory(
  async (url: string, { onProgress }) => {
    const response = await ky(url, {
      onDownloadProgress(info) {
        if (info.totalBytes > 0) {
          onProgress(info.percent);
        }
      },
    }).arrayBuffer();

    const { showSpec, zip } = await processFile(response);
    const base64Blob = await zip.generateAsync({ type: 'base64' });

    // Pre-freeze the show data shallowly to give a hint to Redux Toolkit that
    // the show content won't change
    return { spec: freeze(showSpec), url, base64Blob };
  },
  {
    errorMessage: 'Failed to load show from the given URL.',
  }
);

/**
 * Second step of the show loading process that takes a show in JSON format
 * and dispatches the appropriate actions to update the state store with the
 * new show.
 */
function processShowInJSONFormatAndDispatchActions(
  spec: ShowSpecification,
  dispatch: AppDispatch
): void {
  const drones = spec.swarm?.drones;
  if (!Array.isArray(drones)) {
    return;
  }

  dispatch(setMappingLength(drones.length));

  const environment = spec.environment;
  if (environment?.type) {
    dispatch(setEnvironmentType(environment.type));
  }

  if (environment?.type === EnvironmentType.INDOOR) {
    dispatch(setOutdoorShowOrigin(null));
  }

  // Update the takeoff and landing positions and the takeoff headings in the
  // mission from the loaded show settings
  dispatch(setupMissionFromShow());

  // Revoke the approval of the takeoff area in case it was approved
  dispatch(revokeTakeoffAreaApproval());

  // For indoor shows we use automatic start by default, not using an RC
  if (environment?.type === EnvironmentType.INDOOR) {
    dispatch(setStartMethod(StartMethod.AUTO));
  }
}

/**
 * Thunk that attempts to reload the currently loaded show file.
 */
export const reloadCurrentShowFile =
  (): AppThunk => async (dispatch, getState) => {
    const { getFileAsBlob } = window.bridge ?? {};

    if (!getFileAsBlob) {
      console.warn('reloadCurrentShowFile() works only in Electron');
      return;
    }

    const filename = getAbsolutePathOfShowFile(getState());
    if (filename) {
      const { buffer, props } = await getFileAsBlob(filename);
      const blob: FileLike = Object.assign(new Blob([buffer]), props);
      return dispatch(loadShowFromFile(blob));
    }
  };

/**
 * Thunk that signs off on the manual preflight checks with the current
 * timestamp.
 */
export const signOffOnManualPreflightChecks = (): AppThunk => (dispatch) => {
  dispatch(signOffOnManualPreflightChecksAt(Date.now()));
};

/**
 * Thunk that signs off on the onboard preflight checks with the current
 * timestamp.
 */
export const signOffOnOnboardPreflightChecks = (): AppThunk => (dispatch) => {
  dispatch(signOffOnOnboardPreflightChecksAt(Date.now()));
};

export const setFirstCornerOfRoom =
  (newCorner: Coordinate3D): AppThunk =>
  (dispatch, getState) => {
    const corners = getRoomCorners(getState());
    dispatch(setRoomCorners([newCorner, corners[1]]));
  };

export const setSecondCornerOfRoom =
  (newCorner: Coordinate3D): AppThunk =>
  (dispatch, getState) => {
    const corners = getRoomCorners(getState());
    dispatch(setRoomCorners([corners[0], newCorner]));
  };

export const setOutdoorShowAltitudeReferenceType =
  (type: AltitudeReference): AppThunk =>
  (dispatch, getState) => {
    dispatch(
      _setOutdoorShowAltitudeReference({
        ...getOutdoorShowAltitudeReference(getState()),
        type,
      })
    );
    dispatch(clearShowUploadResult());
  };

export const setOutdoorShowAltitudeReferenceValue =
  (value: string | number): AppThunk =>
  (dispatch, getState) => {
    const altitude = Number(value);
    if (Number.isFinite(altitude) && altitude >= -10000 && altitude <= 10000) {
      dispatch(
        _setOutdoorShowAltitudeReference({
          ...getOutdoorShowAltitudeReference(getState()),
          value: altitude,
        })
      );
      dispatch(clearShowUploadResult());
    }
  };

export const setOutdoorShowAltitudeReferenceToAverageAMSL =
  (): AppThunk => (dispatch, getState) => {
    const state = getState();

    // This will include drones that are sleeping, but that's okay.
    // See discussion in https://github.com/skybrush-io/live/issues/80
    const activeUAVIds = getActiveUAVIds(state);
    const altitudes: number[] = [];

    for (const uavId of activeUAVIds) {
      const pos = getCurrentGPSPositionByUavId(state, uavId);
      if (pos && typeof pos.amsl === 'number' && Number.isFinite(pos.amsl)) {
        altitudes.push(pos.amsl);
      }
    }

    if (altitudes.length > 0) {
      const avgAltitude = sum(altitudes) / altitudes.length;
      dispatch(setOutdoorShowAltitudeReferenceValue(avgAltitude.toFixed(1)));
    }
  };

type ConfirmationOptions = {
  confirmationMessage: string;
  confirmationTitle: string;
};

const confirmedCollectiveOperation = async (
  dispatch: AppDispatch,
  getState: () => RootState,
  { confirmationMessage, confirmationTitle }: ConfirmationOptions
): Promise<boolean> => {
  const baseState = getState();
  if (selectIsCollectiveRTHTriggered(baseState)) {
    console.error(
      'Tried to trigger collective action when collective RTH was already triggered.'
    );
    return false;
  }

  if (
    getUAVOperationConfirmationStyle(baseState) !==
    UAVOperationConfirmationStyle.NEVER
  ) {
    const confirmation: PromptResponse = await dispatch(
      showConfirmationDialog(confirmationMessage, {
        title: confirmationTitle,
      })
    );
    if (!confirmation?.confirmed) {
      return false;
    }
  }

  return true;
};

export const startCollectiveRTH =
  (): AppThunk => async (dispatch, getState) => {
    const proceed = await confirmedCollectiveOperation(dispatch, getState, {
      confirmationMessage: i18n.t('show.collectiveRTH.confirmation.message'),
      confirmationTitle: i18n.t('show.collectiveRTH.confirmation.title'),
    });
    if (!proceed) {
      return;
    }

    try {
      const schedule = await messageHub.execute.startCollectiveRTH();
      const rthSegment = schedule.schedule.find(
        (segment) => segment.type === 'rth'
      );
      dispatch(setShowControlSchedule(schedule));
      showSuccess(
        i18n.t('show.collectiveRTH.notification.success'),
        rthSegment === undefined
          ? undefined
          : {
              countdown: true,
              timeout: rthSegment.startMs - Date.now(),
            }
      );
    } catch (error) {
      showError(
        (error as Error).message ??
          i18n.t('show.collectiveRTH.notification.error'),
        { permanent: true }
      );
    }
  };

export const suspendShow = (): AppThunk => async (dispatch, getState) => {
  const proceed = await confirmedCollectiveOperation(dispatch, getState, {
    confirmationMessage: i18n.t('show.suspend.confirmation.message'),
    confirmationTitle: i18n.t('show.suspend.confirmation.title'),
  });
  if (!proceed) {
    return;
  }

  try {
    const schedule = await messageHub.execute.suspendShow();
    const lastSegment = schedule.schedule.at(-1);
    const timeout = lastSegment ? lastSegment.endMs - Date.now() : Number.NaN;
    const notificationOptions = Number.isNaN(timeout)
      ? undefined
      : { countdown: true, timeout };
    dispatch(setShowControlSchedule(schedule));
    showSuccess(
      i18n.t('show.suspend.notification.success'),
      notificationOptions
    );
  } catch (error) {
    showError(
      (error as Error).message ?? i18n.t('show.suspend.notification.error'),
      {
        permanent: true,
      }
    );
  }
};

export const resumeShow = (): AppThunk => async (dispatch, getState) => {
  const proceed = await confirmedCollectiveOperation(dispatch, getState, {
    confirmationMessage: i18n.t('show.resume.confirmation.message'),
    confirmationTitle: i18n.t('show.resume.confirmation.title'),
  });
  if (!proceed) {
    return;
  }

  try {
    const schedule = await messageHub.execute.resumeShow();
    const lastSegment = schedule.schedule.at(-1);
    const timeout = lastSegment ? lastSegment.endMs - Date.now() : Number.NaN;
    const notificationOptions = Number.isNaN(timeout)
      ? undefined
      : { countdown: true, timeout };
    dispatch(setShowControlSchedule(schedule));
    showSuccess(
      i18n.t('show.resume.notification.success'),
      notificationOptions
    );
  } catch (error) {
    showError(
      (error as Error).message ?? i18n.t('show.resume.notification.error'),
      {
        permanent: true,
      }
    );
  }
};
