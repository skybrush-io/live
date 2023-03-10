import isNil from 'lodash-es/isNil';
import { CANCEL } from 'redux-saga';

import { GeofenceAction } from '~/features/geofence/model';
import {
  getGeofenceActionWithValidation,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import { JobScope } from '~/features/upload/jobs';
import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';
import {
  getCommonShowSettings,
  getDroneSwarmSpecification,
  getGeofencePolygonInShowCoordinates,
  getMeanSeaLevelReferenceOfShowCoordinatesOrNull,
  getOutdoorShowCoordinateSystem,
  getShowMetadata,
  getUserDefinedDistanceLimit,
  getUserDefinedHeightLimit,
  isShowOutdoor,
} from './selectors';

/**
 * Retrieves a complete geofence specification object that is to be used in
 * the show specification that is to be sent to the server during the upload
 * task.
 */
const getGeofenceSpecificationForShow = (state) => {
  const geofenceAction = getGeofenceActionWithValidation(state);
  const geofencePolygon = getGeofencePolygonInShowCoordinates(state);
  const geofence = {
    version: 1,
    enabled: true,
    polygons: geofencePolygon
      ? [
          {
            isInclusion: true,
            points: geofencePolygon,
          },
        ]
      : [],
    rallyPoints: [],
    maxAltitude: getUserDefinedHeightLimit(state),
    maxDistance: getUserDefinedDistanceLimit(state),
  };

  if (geofenceAction !== GeofenceAction.KEEP_CURRENT) {
    geofence.action = geofenceAction;
  }

  return geofence;
};

/**
 * Selector that constructs the show description to be uploaded to a
 * drone with the given ID.
 */
export function createShowConfigurationForUav(state, uavId) {
  const reverseMapping = getReverseMissionMapping(state);
  const missionIndex = reverseMapping ? reverseMapping[uavId] : undefined;

  if (isNil(missionIndex)) {
    throw new Error(`UAV ${uavId} is not in the current mission`);
  }

  const coordinateSystem = getOutdoorShowCoordinateSystem(state);
  if (
    isShowOutdoor(state) &&
    (typeof coordinateSystem !== 'object' ||
      !Array.isArray(coordinateSystem.origin))
  ) {
    throw new TypeError('Show coordinate system not specified');
  }

  const geofence = getGeofenceSpecificationForShow(state);

  const drones = getDroneSwarmSpecification(state);
  if (!drones || !Array.isArray(drones)) {
    throw new Error('Invalid show configuration in state store');
  }

  const droneSpec = drones[missionIndex];
  if (!droneSpec || typeof droneSpec !== 'object') {
    throw new Error(
      `No specification for UAV ${uavId} (index ${missionIndex})`
    );
  }

  const { settings } = droneSpec;
  if (typeof settings !== 'object') {
    throw new TypeError(
      `Invalid show configuration for UAV ${uavId} (index ${missionIndex}) in state store`
    );
  }

  const { id: missionId } = getShowMetadata(state);

  const amslReference = getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state);

  const result = {
    ...getCommonShowSettings(state),
    ...settings,
    amslReference,
    coordinateSystem,
    geofence,
    mission: {
      id: missionId,
      index: missionIndex,
      displayName: `${missionId || 'drone-show'} / ${missionIndex + 1}`,
      numDrones: drones.length,
    },
  };

  return result;
}

/**
 * Handles a single trajectory upload to a drone. Returns a promise that resolves
 * when the trajectory is uploaded. The promise is extended with a cancellation
 * callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the show trajectory to
 * @param data     the show specification, as selected from the state store
 */
async function runSingleShowUpload({ uavId, data }) {
  // No need for a timeout here; it utilizes the message hub, which has its
  // own timeout for failed command executions (although it is quite long)
  const cancelToken = messageHub.createCancelToken();
  const promise = messageHub.execute.uploadDroneShow(
    { uavId, data },
    { cancelToken }
  );
  promise[CANCEL] = () => cancelToken.cancel({ allowFailure: true });
  return promise;
}

const spec = {
  executor: runSingleShowUpload,
  selector: createShowConfigurationForUav,
  scope: JobScope.MISSION,
  title: 'Upload show data',
  type: JOB_TYPE,
};

export default spec;
