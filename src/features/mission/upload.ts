import { produce } from 'immer';
import isNil from 'lodash-es/isNil';
import { CANCEL } from 'redux-saga';

import {
  GeofenceAction,
  type GeofenceConfiguration,
  type GeofenceConfigurationWireFormat,
} from '~/features/safety/model';
import {
  getSafetySettings,
  getUserDefinedDistanceLimit,
  getUserDefinedHeightLimit,
} from '~/features/safety/selectors';
import {
  JobScope,
  type JobExecutorParams,
  type JobSpecification,
} from '~/features/upload/jobs';
import messageHub from '~/message-hub';
import {
  MissionItemType,
  type MissionItem,
  type MissionItemBundle,
} from '~/model/missions';
import type { RootState } from '~/store/reducers';
import type { LonLat } from '~/utils/geography';
import {
  toScaledJSONFromLonLat,
  toScaledJSONFromObject,
} from '~/utils/geography';

import { JOB_TYPE } from './constants';
import {
  getExclusionZonePolygons,
  getGeofenceActionWithValidation,
  getGeofencePolygonInWorldCoordinates,
  getGPSBasedHomePositionsInMission,
  getMissionItemsInOrder,
  getMissionName,
  getReverseMissionMapping,
} from './selectors';
import { doesMissionIndexParticipateInMissionItem } from './utils';

/**
 * Selector that constructs the mission description to be uploaded to a
 * drone with the given ID.
 */
export function createMissionConfigurationForUav(
  state: RootState,
  uavId: string
): MissionItemBundle {
  const reverseMapping = getReverseMissionMapping(state);
  const missionIndex = reverseMapping?.[uavId];

  if (isNil(missionIndex)) {
    throw new Error(`UAV ${uavId} is not in the current mission`);
  }

  const payload = getMissionItemUploadJobPayload(state);

  return {
    ...payload,
    items: payload.items.filter(
      doesMissionIndexParticipateInMissionItem(missionIndex)
    ),
    // TODO: Think about this.
    startPositions: payload.startPositions?.filter(
      (_position, index) => index === missionIndex
    ),
  };
}

/**
 * Handles a mission item upload session to a single drone. Returns a promise that
 * resolves when all the mission items have been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the mission items to
 * @param data     the mission items, as selected from the state store
 */
async function runSingleMissionItemUpload({
  uavId,
  data,
}: JobExecutorParams<void, MissionItemBundle>): Promise<void> {
  const { items } = data ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  // No need for a timeout here; it utilizes the message hub, which has its
  // own timeout for failed command executions (although it is quite long)
  const cancelToken = messageHub.createCancelToken();
  const promise = messageHub.execute.uploadMission(
    { uavId, data, format: 'skybrush-live/mission-items' },
    { cancelToken }
  ) as Promise<void> & { [CANCEL]: () => Promise<void> };

  // Ugly hack to inject cancellation logic to redux-saga
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
 * @param {object} item  the mission item to be transformed
 * @param {object} state the current state of the application
 * @return a new mission item when it is modified, or the item itself if it
 *         does not need to be modified
 */
function transformMissionItemBeforeUpload(
  item: MissionItem,
  state: RootState
): MissionItem {
  switch (item.type) {
    case MissionItemType.UPDATE_FLIGHT_AREA:
      return produce(item, (draft) => {
        if (draft.parameters.flightArea.polygons) {
          for (const p of draft.parameters.flightArea.polygons) {
            p.points = p.points.map(
              toScaledJSONFromLonLat
            ) as unknown as LonLat[];
          }
        }
      });

    case MissionItemType.UPDATE_GEOFENCE:
      return produce(item, (draft) => {
        draft.parameters.coordinateSystem = 'geodetic';
        draft.parameters.geofence = getGeofenceSpecificationForWaypointMission(
          state
        ) as unknown as GeofenceConfiguration;
      });

    case MissionItemType.UPDATE_SAFETY:
      return produce(item, (draft) => {
        Object.assign(draft.parameters.safety, getSafetySettings(state));
      });

    default:
      return item;
  }
}

/**
 * Selector that returns the payload of the mission item upload job.
 */
export const getMissionItemUploadJobPayload = (
  state: RootState
): MissionItemBundle => ({
  version: 1,
  name: getMissionName(state),
  items: getMissionItemsInOrder(state).map((item) =>
    transformMissionItemBeforeUpload(item, state)
  ),
  // TODO: Think about this.
  startPositions: getGPSBasedHomePositionsInMission(state).map(
    (hp) => hp && toScaledJSONFromObject(hp)
  ),
});

/**
 * Retrieves a complete geofence specification object that is to be used in
 * the mission description that is to be sent to the server during the upload
 * task.
 */
const getGeofenceSpecificationForWaypointMission = (
  state: RootState
): GeofenceConfigurationWireFormat => {
  const geofenceAction = getGeofenceActionWithValidation(state);
  const geofencePolygon = getGeofencePolygonInWorldCoordinates(state);
  const exclusionZonePolygons = getExclusionZonePolygons(state);
  const geofence: GeofenceConfigurationWireFormat = {
    version: 1,
    enabled: true,
    polygons: geofencePolygon
      ? [
          {
            isInclusion: true,
            points: geofencePolygon.map(toScaledJSONFromLonLat),
          },
          ...exclusionZonePolygons.map(({ attributes, points }) => ({
            isInclusion: false,
            points: points.map(toScaledJSONFromLonLat),
            altitude: {
              min: attributes?.minAltitude,
              max: attributes?.maxAltitude,
            },
          })),
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

const spec: JobSpecification<void, MissionItemBundle> = {
  executor: runSingleMissionItemUpload,
  selector: createMissionConfigurationForUav,
  scope: JobScope.MISSION,
  title: 'Upload mission items',
  type: JOB_TYPE,
};

export default spec;
