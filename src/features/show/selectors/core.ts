import { createSelector } from '@reduxjs/toolkit';
import formatDate from 'date-fns/format';
import isNil from 'lodash-es/isNil';

import type {
  DroneSpecification,
  Environment,
  ShowMetadata,
  ShowSettings,
  ShowSpecification,
  SwarmSpecification,
  Trajectory,
  ValidationSettings,
} from '@skybrush/show-format';

import {
  getMinimumIndoorTakeoffSpacing,
  getMinimumOutdoorTakeoffSpacing,
} from '~/features/settings/selectors';
import type { AppSelector, RootState } from '~/store/reducers';
import { type Coordinate3D } from '~/utils/math';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '~/utils/redux';

import { sha1 } from '~/utils/hashing';
import {
  AltitudeReference,
  DEFAULT_ALTITUDE_REFERENCE,
  DEFAULT_ROOM_SIZE,
  DEFAULT_TAKEOFF_HEADING,
  TakeoffHeadingMode,
  type TakeoffHeadingSpecification,
} from '../constants';
import { EnvironmentType, SettingsSynchronizationStatus } from '../enums';
import { isValidTrajectory } from '../trajectory';
import type {
  CoordinateSystem,
  EnvironmentState,
  OutdoorCoordinateSystem,
  ShowSegmentsRecord,
} from '../types';
import { isYawActivelyControlled } from '../yaw';

/**
 * Returns the show specification if a show is loaded, `undefined` otherwise.
 */
export const getShowSpecification: AppSelector<
  ShowSpecification | undefined
> = (state) => state.show.data;

/**
 * Returns whether there is a show file currently loaded.
 */
/* TODO(ntamas): maybe check the mission type here as well? state.show.data should
 * go hand-in-hand with state.mission.type */
export const hasLoadedShowFile: AppSelector<boolean> = (state) =>
  Boolean(state.show.data);

/**
 * Returns whether we are currently loading a show file.
 */
export const isLoadingShowFile: AppSelector<boolean> = (state) =>
  state.show.loading;

/**
 * Returns the progress of the current show loading process, as a percentage
 * between 0 and 100.
 */
export const getShowLoadingProgressPercentage: AppSelector<number | null> = (
  state
) => {
  const { progress } = state.show;
  return typeof progress === 'number' ? progress * 100 : null;
};

/**
 * Returns the common show settings that apply to all drones in the currently
 * loaded show.
 */
export const getCommonShowSettings: AppSelector<ShowSettings> = (state) => {
  const result = state.show.data?.settings;
  return typeof result === 'object' ? result : EMPTY_OBJECT;
};

/**
 * Returns the validation settings of the currently loaded show.
 */
export const getShowValidationSettings: AppSelector<
  ValidationSettings | undefined
> = createSelector(getCommonShowSettings, (settings) => settings.validation);

/**
 * Returns whether the show has changed externally since the time it was
 * loaded into the app.
 */
export const hasShowChangedExternallySinceLoaded: AppSelector<boolean> = (
  state
) => state.show.changedSinceLoaded;

/**
 * Returns the name of the file that the currently loaded show came from.
 * Returns null if the currently loaded show comes from another source, the
 * environment did not tell us the full path of the file, or there is no loaded
 * show.
 */
export const getAbsolutePathOfShowFile: AppSelector<string | null> =
  createSelector(
    (state: RootState) => state.show.sourceUrl,
    (url) =>
      url && url.startsWith('file://') ? url.slice('file://'.length) : null
  );

/**
 * Returns whether the manual preflight checks are signed off (i.e. approved)
 * by the operator.
 */
export const areManualPreflightChecksSignedOff: AppSelector<boolean> = (
  state
) => Boolean(state.show.preflight.manualChecksSignedOffAt);

/**
 * Returns whether the onboard preflight checks are signed off (i.e. approved)
 * by the operator.
 */
export const areOnboardPreflightChecksSignedOff: AppSelector<boolean> = (
  state
) => Boolean(state.show.preflight.onboardChecksSignedOffAt);

/**
 * Returns whether the show has received human authorization to start,
 * irrespectively of whether this setting has been synchronized to the server
 * or not.
 */
export const isShowAuthorizedToStartLocally: AppSelector<boolean> = (state) =>
  Boolean(state.show.start.authorized);

/**
 * Returns whether the show has received human authorization to start _and_
 * this has been synchronized with the server.
 */
export const isShowAuthorizedToStart: AppSelector<boolean> = (state) =>
  isShowAuthorizedToStartLocally(state) &&
  areStartConditionsSyncedWithServer(state);

/**
 * Returns whether the start time and start method of the show are synchronized
 * with the server (i.e. the server "knows" about the same desired start time
 * as the client).
 */
export const areStartConditionsSyncedWithServer: AppSelector<boolean> = (
  state
) =>
  state.show.start.syncStatusWithServer ===
  SettingsSynchronizationStatus.SYNCED;

/**
 * Returns the number of drones that are currently scheduled to take off
 * automatically on the server.
 */
export const countUAVsTakingOffAutomatically: AppSelector<number> = (state) => {
  const toStart = state.show.start.uavIds;
  return toStart ? toStart.length : 0;
};

/**
 * Returns whether the last attempt to load a show ended with a failure.
 */
export const didLastLoadingAttemptFail: AppSelector<boolean> = (state) =>
  state.show.lastLoadAttemptFailed;

/**
 * Returns whether the synchronization of the start time and start method of the
 * show with the server failed when we attempted it the last time.
 */
export const didStartConditionSyncFail: AppSelector<boolean> = (state) =>
  state.show.start.syncStatusWithServer === SettingsSynchronizationStatus.ERROR;

/**
 * Returns whether the takeoff area arrangement was approved by the operator.
 */
export const isTakeoffAreaApproved: AppSelector<boolean> = (state) =>
  Boolean(state.show.preflight.takeoffAreaApprovedAt);

/**
 * Selector that returns the type of the show (indoor or outdoor).
 */
export const getShowEnvironmentType = (state: RootState) =>
  state.show.environment.type;

/**
 * Returns the environment specification from the currently loaded show data.
 *
 */
export const getEnvironmentFromLoadedShowData: AppSelector<
  Environment | undefined
> = (state) => state.show.data?.environment;

/**
 * Selector that returns the `environment` part of the `show` state.
 */
export const getEnvironmentState: AppSelector<EnvironmentState> = (state) =>
  state.show.environment;

/**
 * Returns the entire swarm specification if it exists.
 */
export const getSwarmSpecification: AppSelector<
  SwarmSpecification | undefined
> = (state) => state.show.data?.swarm;

/**
 * Returns the specification of the drone swarm in the currently loaded show.
 */
export const getDroneSwarmSpecification: AppSelector<DroneSpecification[]> =
  createSelector(getSwarmSpecification, (swarm) =>
    Array.isArray(swarm?.drones) ? swarm.drones : EMPTY_ARRAY
  );

/**
 * Returns the number of drones in the currently loaded show.
 */
export const getNumberOfDronesInShow: AppSelector<number> = createSelector(
  getDroneSwarmSpecification,
  (swarm) => swarm.length
);

/**
 * Returns an array containing all the trajectories. The array will contain
 * undefined for all the drones that have no fixed trajectories in the mission.
 */
export const getTrajectories: AppSelector<Array<Trajectory | undefined>> =
  createSelector(getDroneSwarmSpecification, (swarm) =>
    swarm.map((drone) => {
      const trajectory = drone.settings.trajectory;
      return isValidTrajectory(trajectory) ? trajectory : undefined;
    })
  );

/**
 * Selector that returns whether the show is indoor.
 */
export const isShowIndoor: AppSelector<boolean> = (state) =>
  getShowEnvironmentType(state) === EnvironmentType.INDOOR;

/**
 * Selector that returns whether the show is outdoor.
 */
export const isShowOutdoor: AppSelector<boolean> = (state) =>
  getShowEnvironmentType(state) === EnvironmentType.OUTDOOR;

/**
 * Selector that returns the definition of the coordinate system of an indoor
 * show.
 */
export const getIndoorShowCoordinateSystem: AppSelector<CoordinateSystem> = (
  state
) => state.show.environment.indoor.coordinateSystem;

/**
 * Selector that returns the orientation of the positive X axis of the
 * indoor show coordinate system, cast into a float.
 *
 * This is needed because we store the orientation of the show coordinate
 * system as a string by default to avoid rounding errors, but most components
 * require a float instead.
 */
export const getIndoorShowOrientation = createSelector(
  getIndoorShowCoordinateSystem,
  (coordinateSystem) =>
    coordinateSystem ? Number.parseFloat(coordinateSystem.orientation) : 0
);

/**
 * Selector that returns the definition of the coordinate system of an outdoor
 * show.
 */
export const getOutdoorShowCoordinateSystem: AppSelector<
  OutdoorCoordinateSystem
> = (state) => state.show.environment.outdoor.coordinateSystem;

/**
 * Selector that returns the orientation of the positive X axis of the
 * outdoor show coordinate system, cast into a float.
 *
 * This is needed because we store the orientation of the show coordinate
 * system as a string by default to avoid rounding errors, but most components
 * require a float instead.
 */
export const getOutdoorShowOrientation = createSelector(
  getOutdoorShowCoordinateSystem,
  (coordinateSystem) => Number.parseFloat(coordinateSystem.orientation)
);

/**
 * Returns the orientation of the positive X axis of the show coordinate system,
 * irrespectively of whether this is an indoor or an outdoor show.
 */
export const getShowOrientation = createSelector(
  isShowIndoor,
  getIndoorShowOrientation,
  getOutdoorShowOrientation,
  (indoor, indoorOrientation, outdoorOrientation) =>
    indoor ? indoorOrientation : outdoorOrientation
);

/**
 * Selector that returns the part of the state object that is related to the
 * altitude reference of the show.
 */
export const getOutdoorShowAltitudeReference = (state: RootState) => {
  const result = state.show.environment.outdoor.altitudeReference;
  return result || DEFAULT_ALTITUDE_REFERENCE;
};

/**
 * Selector that returns the mean sea level that the Z coordinates of the show
 * should be referred to, or null if the show is controlled based on altitudes
 * above home level.
 */
export const getMeanSeaLevelReferenceOfShowCoordinatesOrNull: AppSelector<
  number | null
> = (state) => {
  if (!isShowOutdoor(state)) {
    return null;
  }

  const altitudeReference = getOutdoorShowAltitudeReference(state);
  return altitudeReference &&
    altitudeReference.type === AltitudeReference.AMSL &&
    typeof altitudeReference.value === 'number' &&
    Number.isFinite(altitudeReference.value)
    ? altitudeReference.value
    : null;
};

/**
 * Selector that returns whether the show is tied to a specific altitude above
 * mean sea level.
 *
 * If this selector is true, it means that we can assign a fixed AMSL value to
 * each show-specific Z coordinate by adding the show-specific Z coordinate to
 * the AMSL reference. If this selector is false, it means that the show is
 * controlled in AHL. Indoor shows are always controlled in AHL.
 */
export const isShowRelativeToMeanSeaLevel: AppSelector<boolean> = (state) =>
  !isNil(getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state));

/**
 * Returns whether the origin of the coordinate system of the show has been
 * set up.
 */
export const hasShowOrigin: AppSelector<boolean> = (state) =>
  Boolean(state.show.environment.outdoor.coordinateSystem.origin);

/**
 * Selector that returns the origin of the outdoor show coordinate system.
 */
export const getOutdoorShowOrigin: AppSelector<
  OutdoorCoordinateSystem['origin']
> = createSelector(
  getOutdoorShowCoordinateSystem,
  (coordinateSystem) => coordinateSystem.origin
);

export const getShowSegments: AppSelector<ShowSegmentsRecord | undefined> = (
  state
) => state.show.data?.meta?.segments;

/**
 * Returns the reference clock that the show clock is syncing to.
 */
export const getShowClockReference = (state: RootState) =>
  state.show.start.clock ?? null;

/**
 * Returns the start time of the show. The start time is returned as the number
 * of seconds elapsed from the epoch of the associated show clock, or since the
 * UNIX epoch if there is no associated show clock. Returns undefined if no
 * start time was scheduled yet.
 */
export const getShowStartTime = (state: RootState) => {
  const { clock, timeOnClock, utcTime } = state.show.start;
  const time = isNil(clock) ? utcTime : timeOnClock;
  return isNil(time) || Number.isNaN(time) ? null : time;
};

/**
 * Returns whether there is a scheduled start time for the drone show.
 */
export const hasScheduledStartTime: AppSelector<boolean> = (state) =>
  !isNil(getShowStartTime(state));

/**
 * Returns the metadata of the show, if any.
 */
export const getShowMetadata: AppSelector<ShowMetadata> = createSelector(
  getShowSpecification,
  (data) => (data && typeof data.meta === 'object' ? data.meta : null) || {}
);

/**
 * Returns a suitable title string for the current show file.
 */
export const getShowTitle = createSelector(
  getShowMetadata,
  getNumberOfDronesInShow,
  (meta, numberDrones) => meta.title || `Show with ${numberDrones} drones`
);

/**
 * Selector that returns the base64-encoded blob of the currently loaded show
 * if it exists.
 */
export const getBase64ShowBlob: AppSelector<string | undefined> = (state) =>
  state.show.base64Blob;

/**
 * Returns the start method of the show.
 */
export const getShowStartMethod = (state: RootState) => state.show.start.method;

/**
 * Selector that returns the part of the state object that specifies how the
 * takeoff headings of the show should be calculated when it is an outdoor show.
 */
export const getOutdoorShowTakeoffHeadingSpecification = (state: RootState) => {
  const result = state.show.environment.outdoor.takeoffHeading;
  return result || DEFAULT_TAKEOFF_HEADING;
};

/**
 * Selector that returns the part of the state object that specifies how the
 * takeoff headings of the show should be calculated when it is an indoor show.
 */
export const getIndoorShowTakeoffHeadingSpecification = (state: RootState) => {
  const result = state.show.environment.indoor.takeoffHeading;
  return result || DEFAULT_TAKEOFF_HEADING;
};

/**
 * Selector that returns the takeoff heading specification of the show,
 * irrespectively of whether this is an indoor or an outdoor show.
 */
export const getTakeoffHeadingSpecification: AppSelector<
  TakeoffHeadingSpecification | undefined
> = createSelector(
  isShowIndoor,
  getIndoorShowTakeoffHeadingSpecification,
  getOutdoorShowTakeoffHeadingSpecification,
  (indoor, indoorSpec, outdoorSpec) => (indoor ? indoorSpec : outdoorSpec)
);

/**
 * Selector that returns a function that calculates the effective takeoff
 * heading of the show, given the takeoff heading specification.
 */
export const getCommonTakeoffHeading: AppSelector<number | undefined> =
  createSelector(
    getTakeoffHeadingSpecification,
    getShowOrientation,
    (spec, orientation) => {
      const { type } =
        typeof spec === 'object' ? spec : DEFAULT_TAKEOFF_HEADING;
      const value = convertTakeoffHeadingSpecificationValueToNumber(spec);

      switch (type) {
        case TakeoffHeadingMode.NONE:
          return undefined;

        case TakeoffHeadingMode.ABSOLUTE:
          return value;

        case TakeoffHeadingMode.RELATIVE:
          return (orientation + value) % 360;

        default:
          return undefined;
      }
    }
  );

const convertTakeoffHeadingSpecificationValueToNumber = (
  spec: TakeoffHeadingSpecification | undefined
) => {
  const { value } = typeof spec === 'object' ? spec : DEFAULT_TAKEOFF_HEADING;

  const valueAsNum =
    typeof value === 'string'
      ? Number.parseFloat(value)
      : typeof value === 'number'
        ? value
        : 0;

  return valueAsNum % 360;
};

/**
 * Selector that returns the value in the takeoff heading specification,
 * safely cast into a number.
 */
export const getTakeoffHeadingSpecificationValueAsNumber: AppSelector<
  number
> = (state) => {
  const spec = getTakeoffHeadingSpecification(state);
  return convertTakeoffHeadingSpecificationValueToNumber(spec);
};

/**
 * Returns the preferred minimum spacing between takeoff positions, in meters.
 */
export const getMinimumTakeoffSpacing: AppSelector<number> = createSelector(
  getMinimumOutdoorTakeoffSpacing,
  getMinimumIndoorTakeoffSpacing,
  isShowIndoor,
  (minDistOutdoor, minDistIndoor, isIndoor) =>
    isIndoor ? minDistIndoor : minDistOutdoor
);

/**
 * Returns the width of the room that the indoor show is taking place.
 */
export const getRoomCorners: AppSelector<[Coordinate3D, Coordinate3D]> =
  createSelector(
    (state: RootState) => state.show.environment?.indoor?.room?.firstCorner,
    (state: RootState) => state.show.environment?.indoor?.room?.secondCorner,
    (firstCorner, secondCorner) => [
      firstCorner || [
        -DEFAULT_ROOM_SIZE.width / 2,
        -DEFAULT_ROOM_SIZE.depth / 2,
        0,
      ],
      secondCorner || [
        DEFAULT_ROOM_SIZE.width / 2,
        DEFAULT_ROOM_SIZE.depth / 2,
        DEFAULT_ROOM_SIZE.height,
      ],
    ]
  );

/**
 * Returns whether the indoor room should be shown on the 3D view.
 */
export const isRoomVisible: AppSelector<boolean> = (state) =>
  isShowIndoor(state) && state.show.environment.indoor?.room?.visible;

/**
 * Proposes a name for a mapping file of the current show. Not a pure selector
 * as the filename contains the current date and time.
 */
export const proposeMappingFileName: AppSelector<string> = (state) => {
  // The ISO 8601 extended format cannot be used because colons are usually not
  // allowed in filenames, and the ISO 8601 basic format is less human-readable
  const date = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const path = getAbsolutePathOfShowFile(state);
  const lastSlashIndex = path ? path.lastIndexOf('/') : -1;
  const filename =
    path && lastSlashIndex >= 0 ? path.slice(lastSlashIndex + 1) : path;
  const lastDotIndex = filename ? filename.lastIndexOf('.') : -1;
  const basename =
    filename && lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;

  if (basename && basename.length > 0) {
    return `${basename}_mapping_${date}.txt`;
  } else {
    return `mapping_${date}.txt`;
  }
};

/**
 * Selector that returns whether the show uses yaw control for at least one drone.
 */
export const isShowUsingYawControl = createSelector(
  getDroneSwarmSpecification,
  (swarm) =>
    swarm.some((drone) => {
      const yawControl = drone.settings.yawControl;
      return isYawActivelyControlled(yawControl);
    })
);

/**
 * Selector that returns a `Promise` that resolves to the hash of the
 * currently loaded show and the related show-specific configuration.
 *
 * If you need this selector in a React component, make sure the component
 * re-renders when the promise is resolved.
 */
export const getShowHash: AppSelector<Promise<string> | undefined> =
  createSelector(getShowSpecification, (spec) =>
    spec === undefined ? undefined : sha1(JSON.stringify(spec))
  );
