import { CANCEL } from 'redux-saga';

import {
  getGeofenceActionWithValidation,
  getGeofencePolygonInWorldCoordinates,
  getMissionItemsInOrder,
  getMissionName,
} from '~/features/mission/selectors';
import { GeofenceAction } from '~/features/safety/model';
import {
  getSafetySettings,
  getUserDefinedDistanceLimit,
  getUserDefinedHeightLimit,
} from '~/features/safety/selectors';
import { JobScope } from '~/features/upload/jobs';
import messageHub from '~/message-hub';
import { MissionItemType } from '~/model/missions';
import { toScaledJSONFromLonLat } from '~/utils/geography';

import { JOB_TYPE } from './constants';

/**
 * Handles a mission item upload session to a single drone. Returns a promise that
 * resolves when all the mission items have been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the mission items to
 * @param payload  the mission items
 */
async function runSingleMissionItemUpload({ uavId, payload }) {
  const { items } = payload ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  // No need for a timeout here; it utilizes the message hub, which has its
  // own timeout for failed command executions (although it is quite long)
  const cancelToken = messageHub.createCancelToken();
  const promise = messageHub.execute.uploadMission(
    { uavId, data: payload, format: 'skybrush-live/mission-items' },
    { cancelToken }
  );
  promise[CANCEL] = () => cancelToken.cancel({ allowFailure: true });
  return promise;
}

/**
 * Helper function that transforms certain mission items before upload,
 * depending on the state of the application.
 *
 * E.g., this function can be used to fill in the details of the current
 * geofence in the "update geofence" mission item.
 *
 * @param {object} item  the mission item to be transformed in-place
 * @param {object} state the current state of the application
 * @return a new mission item when it is modified, or the item itself if it
 *         does not need to be modified
 */
export function transformMissionItemBeforeUpload(item, state) {
  switch (item.type) {
    case MissionItemType.UPDATE_GEOFENCE:
      item = {
        ...item,
        parameters: {
          ...item.parameters,
          coordinateSystem: 'geodetic',
          // TODO(ntamas): transform polygon coordinates to the format used over the wire
          geofence: getGeofenceSpecificationForWaypointMission(state),
        },
      };
      break;

    case MissionItemType.UPDATE_SAFETY:
      item = {
        ...item,
        parameters: {
          ...item.parameters,
          safety: {
            ...item.parameters.safety,
            ...getSafetySettings(state),
          },
        },
      };
      break;

    default:
      break;
  }

  return item;
}

/**
 * Selector that returns the payload of the mission item upload job.
 */
export const getMissionItemUploadJobPayload = (state) => {
  const name = getMissionName(state);
  const items = getMissionItemsInOrder(state).map((item) =>
    transformMissionItemBeforeUpload(item, state)
  );
  return { version: 1, name, items };
};

/**
 * Retrieves a complete geofence specification object that is to be used in
 * the mission description that is to be sent to the server during the upload
 * task.
 */
const getGeofenceSpecificationForWaypointMission = (state) => {
  const geofenceAction = getGeofenceActionWithValidation(state);
  const geofencePolygon = getGeofencePolygonInWorldCoordinates(state);
  const geofence = {
    version: 1,
    enabled: true,
    polygons: geofencePolygon
      ? [
          {
            isInclusion: true,
            points: geofencePolygon.map(toScaledJSONFromLonLat),
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

const spec = {
  executor: runSingleMissionItemUpload,
  scope: JobScope.SINGLE,
  title: 'Upload mission items',
  type: JOB_TYPE,
};

export default spec;
