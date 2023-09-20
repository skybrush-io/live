/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import getUnixTime from 'date-fns/getUnixTime';
import isNil from 'lodash-es/isNil';
import set from 'lodash-es/set';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  COORDINATE_SYSTEM_TYPE,
  type ShowSpecification,
} from '@skybrush/show-format';

import { type Clock } from '~/features/clocks/types';
import type UAV from '~/model/uav';
import { type Coordinate2D, type Coordinate3D } from '~/utils/math';
import { noPayload } from '~/utils/redux';

import {
  type AltitudeReferenceSpecification,
  DEFAULT_ALTITUDE_REFERENCE,
  DEFAULT_ROOM_SIZE,
  DEFAULT_TAKEOFF_HEADING,
  type TakeoffHeadingSpecification,
} from './constants';
import {
  EnvironmentType,
  SettingsSynchronizationStatus,
  StartMethod,
} from './enums';

type ShowSliceState = {
  data?: ShowSpecification;

  loading: boolean;
  progress?: number;

  sourceUrl?: string;
  changedSinceLoaded: boolean;
  lastLoadAttemptFailed: boolean;

  environment: {
    editing: boolean;
    outdoor: {
      coordinateSystem: {
        orientation: string; // stored as a string to avoid rounding errors
        origin?: Coordinate2D;
        type: 'neu' | 'nwu';
      };
      altitudeReference: AltitudeReferenceSpecification;
      takeoffHeading: TakeoffHeadingSpecification;
    };
    indoor: {
      coordinateSystem: {
        orientation: string; // stored as a string to avoid rounding errors
      };
      room: {
        visible: false;
        firstCorner: Coordinate3D;
        secondCorner: Coordinate3D;
      };
      takeoffHeading: TakeoffHeadingSpecification;
    };
    type: EnvironmentType;
  };

  loadShowFromCloudDialog: {
    open: boolean;
  };

  manualPreflightChecksDialog: {
    open: boolean;
  };

  onboardPreflightChecksDialog: {
    open: boolean;
  };

  preflight: {
    manualChecksSignedOffAt?: number;
    onboardChecksSignedOffAt?: number;
    takeoffAreaApprovedAt?: number;
  };

  start: {
    /** Whether the show has been authorized to start */
    authorized: boolean;

    /**
     * ID of the reference clock that the start time is based on; `undefined`
     * means UTC time
     */
    clock?: Clock['id'];

    /**
     * The start time of the show, in UTC time, used if and only if clock is
     * falsy
     */
    utcTime?: number;

    /** Start time of the show in the related reference clock, in seconds */
    timeOnClock?: number;

    /**
     * Whether the show is started automatically or manually with a remote
     * controller
     */
    method: StartMethod;

    /**
     * The list of UAV IDs that the server will start automatically. This
     * value is read from the server only but is never written there; we will
     * infer the UAV ID list from the mapping instead and write that to the
     * server. It is not relevant if the show is set to start manually
     */
    uavIds: Array<UAV['id']>;

    /** Whether the state variables in this object are synced with the server */
    syncStatusWithServer: SettingsSynchronizationStatus;
  };

  startTimeDialog: {
    open: boolean;
  };

  takeoffAreaSetupDialog: {
    open: boolean;
  };
};

const initialState: ShowSliceState = {
  data: undefined,

  loading: false,
  progress: 0,

  sourceUrl: undefined,
  changedSinceLoaded: false,
  lastLoadAttemptFailed: false,

  environment: {
    editing: false,
    outdoor: {
      coordinateSystem: {
        orientation: '0',
        origin: undefined,
        type: COORDINATE_SYSTEM_TYPE,
      },
      altitudeReference: {
        ...DEFAULT_ALTITUDE_REFERENCE,
      },
      takeoffHeading: {
        ...DEFAULT_TAKEOFF_HEADING,
      },
    },
    indoor: {
      coordinateSystem: {
        orientation: '0',
      },
      room: {
        visible: false,
        firstCorner: [
          -DEFAULT_ROOM_SIZE.width / 2,
          -DEFAULT_ROOM_SIZE.depth / 2,
          0,
        ],
        secondCorner: [
          DEFAULT_ROOM_SIZE.width / 2,
          DEFAULT_ROOM_SIZE.depth / 2,
          DEFAULT_ROOM_SIZE.height,
        ],
      },
      takeoffHeading: {
        ...DEFAULT_TAKEOFF_HEADING,
      },
    },
    type: EnvironmentType.OUTDOOR,
  },

  loadShowFromCloudDialog: {
    open: false,
  },

  manualPreflightChecksDialog: {
    open: false,
  },

  onboardPreflightChecksDialog: {
    open: false,
  },

  preflight: {
    manualChecksSignedOffAt: undefined,
    onboardChecksSignedOffAt: undefined,
    takeoffAreaApprovedAt: undefined,
  },

  start: {
    authorized: false,
    clock: undefined,
    utcTime: undefined,
    timeOnClock: undefined,
    method: StartMethod.RC,
    uavIds: [],
    syncStatusWithServer: SettingsSynchronizationStatus.NOT_SYNCED,
  },

  startTimeDialog: {
    open: false,
  },

  takeoffAreaSetupDialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'show',
  initialState,
  reducers: {
    approveTakeoffAreaAt(state, action: PayloadAction<number>) {
      state.preflight.takeoffAreaApprovedAt = action.payload;
    },

    clearLoadedShow: noPayload<ShowSliceState>((state) => {
      state.data = undefined;

      state.sourceUrl = undefined;
      state.changedSinceLoaded = false;

      state.preflight.manualChecksSignedOffAt = undefined;
      state.preflight.onboardChecksSignedOffAt = undefined;
      state.preflight.takeoffAreaApprovedAt = undefined;

      // Last upload result cleared in the upload feature as it also handles
      // this action
    }),

    clearManualPreflightChecks: noPayload<ShowSliceState>((state) => {
      state.preflight.manualChecksSignedOffAt = undefined;
    }),

    clearOnboardPreflightChecks: noPayload<ShowSliceState>((state) => {
      state.preflight.onboardChecksSignedOffAt = undefined;
    }),

    clearStartTimeAndMethod(state) {
      state.start.utcTime = undefined;
      state.start.timeOnClock = undefined;
      state.start.method = StartMethod.RC;
    },

    closeEnvironmentEditorDialog: noPayload<ShowSliceState>((state) => {
      state.environment.editing = false;
    }),

    closeLoadShowFromCloudDialog: noPayload<ShowSliceState>((state) => {
      state.loadShowFromCloudDialog.open = false;
    }),

    closeManualPreflightChecksDialog: noPayload<ShowSliceState>((state) => {
      state.manualPreflightChecksDialog.open = false;
    }),

    closeOnboardPreflightChecksDialog: noPayload<ShowSliceState>((state) => {
      state.onboardPreflightChecksDialog.open = false;
    }),

    closeStartTimeDialog: noPayload<ShowSliceState>((state) => {
      state.startTimeDialog.open = false;
    }),

    closeTakeoffAreaSetupDialog: noPayload<ShowSliceState>((state) => {
      state.takeoffAreaSetupDialog.open = false;
    }),

    loadingProgress(state, action: PayloadAction<number | undefined>) {
      if (state.loading) {
        const value = Number(action.payload);
        if (Number.isNaN(value)) {
          state.progress = undefined;
        } else {
          state.progress = Math.min(1, Math.max(value, 0));
        }
      }
    },

    loadingPromisePending(state) {
      state.loading = true;
      state.progress = undefined;

      // This line ensures that the "show changed" warning goes away as soon as
      // the user starts to reload the show
      state.changedSinceLoaded = false;
    },

    loadingPromiseFulfilled(
      state,
      action: PayloadAction<{ spec: ShowSpecification; url?: string }>
    ) {
      const { spec, url } = action.payload;

      state.data = spec;
      state.sourceUrl = url;
      state.loading = false;
      state.progress = undefined;

      // Just in case the "show changed" warning was triggered while we tried
      // to load it...
      state.changedSinceLoaded = false;
    },

    loadingPromiseRejected(state) {
      state.loading = false;
      state.progress = undefined;

      state.changedSinceLoaded = false;
    },

    notifyShowFileChangedSinceLoaded(state) {
      state.changedSinceLoaded = true;
    },

    openEnvironmentEditorDialog: noPayload<ShowSliceState>((state) => {
      state.environment.editing = true;
    }),

    openLoadShowFromCloudDialog: noPayload<ShowSliceState>((state) => {
      state.loadShowFromCloudDialog.open = true;
    }),

    openManualPreflightChecksDialog: noPayload<ShowSliceState>((state) => {
      state.manualPreflightChecksDialog.open = true;
    }),

    openOnboardPreflightChecksDialog: noPayload<ShowSliceState>((state) => {
      state.onboardPreflightChecksDialog.open = true;
    }),

    openStartTimeDialog: noPayload<ShowSliceState>((state) => {
      state.startTimeDialog.open = true;
    }),

    openTakeoffAreaSetupDialog: noPayload<ShowSliceState>((state) => {
      state.takeoffAreaSetupDialog.open = true;
    }),

    revokeTakeoffAreaApproval: noPayload<ShowSliceState>((state) => {
      state.preflight.takeoffAreaApprovedAt = undefined;
    }),

    setEnvironmentType(state, action: PayloadAction<EnvironmentType>) {
      state.environment.type = action.payload;
    },

    setIndoorShowOrientation(state, action: PayloadAction<string | number>) {
      state.environment.indoor.coordinateSystem.orientation = String(
        action.payload
      );
    },

    setIndoorShowTakeoffHeadingSpecification(
      state,
      action: PayloadAction<TakeoffHeadingSpecification | undefined>
    ) {
      state.environment.indoor.takeoffHeading =
        action.payload ?? DEFAULT_TAKEOFF_HEADING;
    },

    setLastLoadingAttemptFailed(state, action: PayloadAction<boolean>) {
      state.lastLoadAttemptFailed = Boolean(action.payload);
    },

    _setOutdoorShowAltitudeReference(
      state,
      action: PayloadAction<AltitudeReferenceSpecification>
    ) {
      const { payload } = action;

      if (
        typeof payload === 'object' &&
        payload.type !== undefined &&
        payload.value !== undefined
      ) {
        state.environment.outdoor.altitudeReference = payload;
      }
    },

    setOutdoorShowOrientation(state, action: PayloadAction<number | string>) {
      state.environment.outdoor.coordinateSystem.orientation = String(
        action.payload
      );
    },

    setOutdoorShowOrigin(state, action: PayloadAction<Coordinate2D>) {
      state.environment.outdoor.coordinateSystem.origin = action.payload;
    },

    setOutdoorShowTakeoffHeadingSpecification(
      state,
      action: PayloadAction<TakeoffHeadingSpecification | undefined>
    ) {
      state.environment.outdoor.takeoffHeading =
        action.payload ?? DEFAULT_TAKEOFF_HEADING;
    },

    setRoomCorners(state, action: PayloadAction<[Coordinate3D, Coordinate3D]>) {
      const corners = action.payload;
      if (!Array.isArray(corners) || corners.length < 2) {
        return;
      }

      const firstCorner = corners[0];
      const secondCorner = corners[1];

      if (
        !Array.isArray(firstCorner) ||
        firstCorner.length < 3 ||
        !Array.isArray(secondCorner) ||
        secondCorner.length < 3
      ) {
        return;
      }

      set(
        state,
        'environment.indoor.room.firstCorner',
        firstCorner.slice(0, 3)
      );
      set(
        state,
        'environment.indoor.room.secondCorner',
        secondCorner.slice(0, 3)
      );
    },

    setRoomVisibility(state, action: PayloadAction<boolean>) {
      set(state, 'environment.indoor.room.visible', Boolean(action.payload));
    },

    setShowAuthorization(state, action: PayloadAction<boolean>) {
      // We only accept 'true' for authorization to be on the safe side, not
      // just any truthy value
      state.start.authorized = (action.payload as unknown) === true;
    },

    setShowSettingsSynchronizationStatus(
      state,
      action: PayloadAction<SettingsSynchronizationStatus>
    ) {
      if (
        Object.values(SettingsSynchronizationStatus).includes(action.payload)
      ) {
        state.start.syncStatusWithServer = action.payload;
      }
    },

    setStartMethod(state, action: PayloadAction<StartMethod>) {
      if (Object.values(StartMethod).includes(action.payload)) {
        state.start.method = action.payload;
      }
    },

    setStartTime(
      state,
      action: PayloadAction<
        | { clock: Clock['id']; time: number }
        | { clock: undefined; time: Date | number }
      >
    ) {
      const { payload } = action;
      const { clock, time: timeFromPayload } = payload || {};

      state.start.clock =
        isNil(clock) || clock === '' ? undefined : String(clock);

      const hasClock = !isNil(state.start.clock);

      if (hasClock) {
        state.start.timeOnClock =
          isNil(timeFromPayload) || typeof timeFromPayload !== 'number'
            ? undefined
            : timeFromPayload;
      } else {
        const dateTime =
          timeFromPayload instanceof Date
            ? getUnixTime(timeFromPayload)
            : timeFromPayload;
        if (typeof dateTime === 'number') {
          state.start.utcTime = dateTime;
        } else {
          state.start.utcTime = undefined;
        }
      }
    },

    setUAVIdsToStartAutomatically(
      state,
      action: PayloadAction<Array<UAV['id']>>
    ) {
      if (Array.isArray(action.payload)) {
        state.start.uavIds = action.payload;
      }
    },

    signOffOnManualPreflightChecksAt(state, action: PayloadAction<number>) {
      state.preflight.manualChecksSignedOffAt = action.payload;
    },

    signOffOnOnboardPreflightChecksAt(state, action: PayloadAction<number>) {
      state.preflight.onboardChecksSignedOffAt = action.payload;
    },

    synchronizeShowSettings() {
      // Nothing to do, this action simply triggers a saga that will do the
      // hard work.
    },
  },
});

export const {
  approveTakeoffAreaAt,
  clearLoadedShow,
  clearManualPreflightChecks,
  clearOnboardPreflightChecks,
  clearStartTimeAndMethod,
  closeEnvironmentEditorDialog,
  closeLoadShowFromCloudDialog,
  closeManualPreflightChecksDialog,
  closeOnboardPreflightChecksDialog,
  closeStartTimeDialog,
  closeTakeoffAreaSetupDialog,
  loadingProgress,
  loadingPromiseFulfilled,
  notifyShowFileChangedSinceLoaded,
  openEnvironmentEditorDialog,
  openLoadShowFromCloudDialog,
  openManualPreflightChecksDialog,
  openOnboardPreflightChecksDialog,
  openStartTimeDialog,
  openTakeoffAreaSetupDialog,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setIndoorShowOrientation,
  setIndoorShowTakeoffHeadingSpecification,
  setLastLoadingAttemptFailed,
  _setOutdoorShowAltitudeReference,
  setOutdoorShowOrientation,
  setOutdoorShowOrigin,
  setOutdoorShowTakeoffHeadingSpecification,
  setRoomCorners,
  setRoomVisibility,
  setShowAuthorization,
  setShowSettingsSynchronizationStatus,
  setStartMethod,
  setStartTime,
  setUAVIdsToStartAutomatically,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  synchronizeShowSettings,
} = actions;

export default reducer;
