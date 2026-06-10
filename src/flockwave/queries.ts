/**
 * Functions for handling common queries to the Flockwave server using
 * promises.
 */

import type {
  DroneShowConfiguration,
  FirmwareUpdateTarget,
  License,
  Response_BCNPROPS,
  Response_EXTCFG,
  Response_EXTLIST,
  Response_FWOBJECTLIST,
  Response_FWTARGETINF,
  Response_FWTARGETLIST,
  Response_LCNINF,
  Response_RTKINF,
  Response_RTKLIST,
  Response_RTKSOURCE,
  Response_RTKSTAT,
  Response_RTKSURVEY,
  Response_SHOWCFG,
  Response_SYSPORTS,
  Response_UAVPREFLT,
  Response_WTHAT,
  RTKConfigurationPreset,
  RTKSurveySettings,
  ServicePortMap,
  UAVPreflightCheckInfo,
  WeatherInfo,
} from '@skybrush/flockwave-spec';
import sortBy from 'lodash-es/sortBy';
import memoize from 'memoizee';

import { errorToString } from '~/error-handling';
import type { BeaconPropertiesMap } from '~/features/beacons/types';
import type { OutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import {
  type FlightLog,
  type FlightLogMetadata,
  validateFlightLogMetadata,
  validateFlockwaveFlightLog,
} from '~/model/flight-logs';
import type { ItemLike } from '~/utils/collections';
import type { LonLat } from '~/utils/geography';
import { toScaledJSONFromLonLat } from '~/utils/geography';

import type MessageHub from './messages';
import type { ProgressStatus } from './messages';
import { extractResponseForId } from './parsing';
import type {
  CollectiveRTHConfig,
  Response_XMSNTYPEINF,
  Response_XMSNTYPELIST,
  Response_XMSNTYPESCHEMA,
  Response_XSHOWADAPT,
  Response_XSHOWCRTHPLAN,
  ShowAdaptTransformation,
} from './types';
import { validateExtensionName } from './validation';

/**
 * Adapts the given base64-encoded show using the given transformation
 * definitions and coordinate system.
 */
export async function adaptShow(
  hub: MessageHub,
  show: string,
  transformations: ShowAdaptTransformation[],
  coordinateSystem: OutdoorCoordinateSystemWithOrigin
): Promise<Response_XSHOWADAPT> {
  const response = await hub.sendMessage<Response_XSHOWADAPT>(
    {
      type: 'X-SHOW-ADAPT',
      show,
      transformations,
      environment: {
        location: {
          origin: toScaledJSONFromLonLat(coordinateSystem.origin),
          orientation: coordinateSystem.orientation,
        },
      },
    },
    // Use a very long timeout for this message as the transformations
    // require a lot of computation.
    { timeout: 600 }
  );

  if (response?.body?.type === 'X-SHOW-ADAPT') {
    return response.body;
  } else {
    throw new Error(response?.body?.reason ?? 'Unknown error.');
  }
}

/**
 * Adds collective RTH plans to drones using the given configuration.
 */
export async function addCollectiveRTH(
  hub: MessageHub,
  show: string,
  config: CollectiveRTHConfig
): Promise<Response_XSHOWCRTHPLAN> {
  const response = await hub.sendMessage<Response_XSHOWCRTHPLAN>(
    {
      type: 'X-SHOW-CRTH-PLAN',
      show,
      config,
    },
    { timeout: 3600 }
  );

  if (response?.body?.type === 'X-SHOW-CRTH-PLAN') {
    return response.body;
  } else {
    throw new Error(response?.body?.reason ?? 'Unknown error.');
  }
}

/**
 * Returns the basic properties of the beacons with the given IDs.
 */
export async function getBasicBeaconProperties(
  hub: MessageHub,
  ids: string[]
): Promise<BeaconPropertiesMap | undefined> {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    throw new Error('Invalid ID array:' + JSON.stringify(ids));
  }

  const response = await hub.sendMessage<Response_BCNPROPS>({
    type: 'BCN-PROPS',
    ids,
  });

  return response.body.type === 'BCN-PROPS' ? response.body.result : undefined;
}

/**
 * Returns the current configuration object of the server extension with the
 * given name.
 */
export async function getConfigurationOfExtension(
  hub: MessageHub,
  name: string
): Promise<Record<string, unknown>> {
  validateExtensionName(name);

  const response = await hub.sendMessage<Response_EXTCFG>({
    type: 'EXT-CFG',
    ids: [name],
  });

  return (
    extractResponseForId(response, name, {
      error: `Failed to retrieve configuration for extension: ${name}`,
    }) ?? {}
  );
}

/**
 * Returns the list of firmware updatable objects from the server.
 */
export async function getFirmwareUpdateObjects(
  hub: MessageHub,
  options: { supports?: string[] } = {}
): Promise<string[]> {
  const { supports } = options;

  const listResponse = await hub.sendMessage<Response_FWOBJECTLIST>({
    type: 'FW-OBJECT-LIST',
    supports,
  });

  if (listResponse?.body?.type === 'FW-OBJECT-LIST') {
    return listResponse.body.ids ?? [];
  } else {
    return [];
  }
}

/**
 * Returns the list of registered firmware update targets from the server.
 */
export async function getFirmwareUpdateTargets(
  hub: MessageHub,
  options: { supportedBy?: string[] } = {}
): Promise<FirmwareUpdateTarget[]> {
  const { supportedBy } = options;

  const listResponse = await hub.sendMessage<Response_FWTARGETLIST>({
    type: 'FW-TARGET-LIST',
    supportedBy,
  });

  if (listResponse?.body?.type === 'FW-TARGET-LIST') {
    const firmwareUpdateTargetIds = listResponse.body.ids ?? [];
    if (firmwareUpdateTargetIds.length > 0) {
      const infResponse = await hub.sendMessage<Response_FWTARGETINF>({
        type: 'FW-TARGET-INF',
        ids: firmwareUpdateTargetIds,
      });
      const firmwareUpdateTargetsById = infResponse?.body?.result ?? {};
      return sortBy(firmwareUpdateTargetsById, ['name', 'id']);
    }
  }

  return [];
}

/**
 * Returns a single flight log from a UAV.
 */
export async function getFlightLog(
  hub: MessageHub,
  uavId: string,
  logId: string,
  { onProgress }: { onProgress?: (status: ProgressStatus) => void } = {}
): Promise<FlightLog> {
  if (!uavId || typeof uavId !== 'string') {
    throw new Error('Expected non-empty UAV ID');
  }

  if (!logId || typeof logId !== 'string') {
    throw new Error('Expected non-empty log ID');
  }

  try {
    const log = await hub.startAsyncOperationForSingleId<FlightLog>(
      uavId,
      {
        type: 'LOG-DATA',
        logId,
        uavId,
      },
      // @ts-expect-error idProp may be null but AsyncOperationOptions types
      //                  it as string | undefined only
      { idProp: null, onProgress, single: true }
    );
    return validateFlockwaveFlightLog(log);
  } catch (error) {
    const errorString = errorToString(error);
    throw new Error(
      `Failed to retrieve log ${logId} for UAV ${uavId}: ${errorString}`
    );
  }
}

/**
 * Returns the list of flight logs on a single UAV.
 */
export async function getFlightLogList(
  hub: MessageHub,
  uavId: string
): Promise<FlightLogMetadata[]> {
  if (!uavId || typeof uavId !== 'string') {
    throw new Error('Expected non-empty UAV ID');
  }

  try {
    const response = await hub.startAsyncOperationForSingleId<
      FlightLogMetadata[]
    >(uavId, { type: 'LOG-INF' });
    return response.map(validateFlightLogMetadata);
  } catch (error) {
    const errorString = errorToString(error);
    throw new Error(
      `Failed to retrieve log list for UAV ${uavId}: ${errorString}`
    );
  }
}

/**
 * Returns the current license object from the server.
 */
export async function getLicenseInformation(
  hub: MessageHub
): Promise<License | undefined> {
  const response = await hub.sendMessage<Response_LCNINF>({ type: 'LCN-INF' });
  return response.body &&
    response.body.type === 'LCN-INF' &&
    typeof response.body.license === 'object'
    ? response.body.license
    : undefined;
}

/**
 * Returns the parameter schema of the mission with the given type from the server.
 */
export async function getMissionTypeSchemas(
  hub: MessageHub,
  missionTypeId: string
  // TODO: improve return type
): Promise<Record<string, unknown>> {
  const response = await hub.sendMessage<Response_XMSNTYPESCHEMA>({
    type: 'X-MSN-TYPE-SCHEMA',
    ids: [missionTypeId],
  });

  // TODO: Handle `response.body.error` if present!

  if (
    response.body &&
    response.body.type === 'X-MSN-TYPE-SCHEMA' &&
    typeof response.body.items === 'object' &&
    response.body.items !== null &&
    typeof response.body.items[missionTypeId] === 'object'
  ) {
    return response.body.items[missionTypeId];
  } else {
    return {};
  }
}

/**
 * Returns the list of registered mission types from the server.
 */
export async function getMissionTypes(
  hub: MessageHub,
  options: { features?: string[] } = {}
  // TODO: improve return type
): Promise<unknown[]> {
  const { features } = options;

  const response = await hub.sendMessage<Response_XMSNTYPELIST>({
    type: 'X-MSN-TYPE-LIST',
  });
  if (response.body && response.body.type === 'X-MSN-TYPE-LIST') {
    const missionTypeIds = response.body.ids ?? [];
    if (missionTypeIds.length > 0) {
      const infResponse = await hub.sendMessage<Response_XMSNTYPEINF>({
        type: 'X-MSN-TYPE-INF',
        ids: missionTypeIds,
      });

      const missionTypesById = infResponse.body?.items ?? {};
      const filtered = Object.values(missionTypesById).filter(
        (item: unknown) => {
          if (typeof item !== 'object' || item === null) {
            return false;
          }
          const typedItem = item as Record<string, unknown>;
          return (
            !Array.isArray(features) ||
            features.some(
              (feature) =>
                Array.isArray(typedItem.features) &&
                typedItem.features.includes(feature)
            )
          );
        }
      );
      return sortBy(filtered, ['name', 'id']);
    }
  }

  return [];
}

/**
 * Returns the current preflight status of a single UAV.
 */
export async function getPreflightStatus(
  hub: MessageHub,
  uavId: string
): Promise<UAVPreflightCheckInfo> {
  if (!uavId || typeof uavId !== 'string') {
    throw new Error('Expected non-empty UAV ID');
  }

  const response = await hub.sendMessage<Response_UAVPREFLT>({
    type: 'UAV-PREFLT',
    ids: [uavId],
  });
  // TODO: fix the Response_UAVPREFLT type, it doesn't have a `result` field.
  const result = (
    (response.body ?? {}) as { result?: Record<string, UAVPreflightCheckInfo> }
  ).result;
  if (response.body?.type === 'UAV-PREFLT' && result && result[uavId]) {
    return result[uavId];
  }

  throw new Error('Unexpected response for preflight status query');
}

/**
 * Returns the list of RTK data sources.
 */
export async function getRTKPresets(
  hub: MessageHub
): Promise<Array<RTKConfigurationPreset & ItemLike>> {
  const listResponse = await hub.sendMessage<Response_RTKLIST>({
    type: 'RTK-LIST',
  });

  if (listResponse.body && listResponse.body.type === 'RTK-LIST') {
    const rtkSourceIds = listResponse.body.ids ?? [];
    if (rtkSourceIds.length > 0) {
      const infResponse = await hub.sendMessage<Response_RTKINF>({
        type: 'RTK-INF',
        ids: rtkSourceIds,
      });

      const presetsById = infResponse.body?.preset ?? {};
      for (const [presetId, preset] of Object.entries(presetsById)) {
        preset.id = presetId;
      }

      return sortBy(Object.values(presetsById), ['title', 'id']) as Array<
        RTKConfigurationPreset & ItemLike
      >;
    }
  }

  return [];
}

/**
 * Returns the RTK surveying settings from the server.
 */
export async function getRTKSurveySettings(
  hub: MessageHub
): Promise<RTKSurveySettings | undefined> {
  const response = await hub.sendMessage<Response_RTKSURVEY>({
    type: 'RTK-SURVEY',
  });

  return response.body.type === 'RTK-SURVEY'
    ? response.body.settings
    : undefined;
}

/**
 * Returns the status of the RTK subsystem.
 */
export async function getRTKStatus(hub: MessageHub): Promise<
  Omit<Response_RTKSTAT, 'messages_tx'> & {
    messagesTx: Response_RTKSTAT['messages_tx'];
  }
> {
  const response = await hub.sendMessage<Response_RTKSTAT>({
    type: 'RTK-STAT',
  });
  if (response.body && response.body.type === 'RTK-STAT') {
    return {
      antenna: response.body.antenna,
      messages: response.body.messages,
      messagesTx: response.body.messages_tx,
      cnr: response.body.cnr,
      survey: response.body.survey,
    };
  }

  throw new Error('Unexpected response for RTK subsystem status query');
}

/**
 * Returns the currently selected RTK data source ID.
 */
export async function getSelectedRTKPresetId(
  hub: MessageHub
): Promise<string | null> {
  const response = await hub.sendMessage<Response_RTKSOURCE>(
    { type: 'RTK-SOURCE' },
    // Use a longer timeout as the server might be busy reconfiguring the RTK
    // source when we ask for it.
    { timeout: 15 }
  );

  if (response.body && response.body.type === 'RTK-SOURCE') {
    return response.body.id ?? null;
  }

  return null;
}

/**
 * Returns the current mapping of services to ports on the server.
 */
export async function getServerPortMapping(
  hub: MessageHub
): Promise<ServicePortMap | undefined> {
  const response = await hub.sendMessage<Response_SYSPORTS>({
    type: 'SYS-PORTS',
  });
  return response.body &&
    response.body.type === 'SYS-PORTS' &&
    typeof response.body.ports === 'object'
    ? response.body.ports
    : undefined;
}

/**
 * Returns the configuration of the current drone show managed by the server.
 */
export async function getShowConfiguration(
  hub: MessageHub
): Promise<DroneShowConfiguration> {
  const response = await hub.sendMessage<Response_SHOWCFG>({
    type: 'SHOW-CFG',
  });
  const configuration = response?.body?.configuration;
  if (configuration && typeof configuration === 'object') {
    return configuration;
  }

  throw new Error('No show configuration returned');
}

/**
 * Returns the weather information at the given location from the server.
 *
 * @param position  the location to query, as a lon-lat pair
 */
export async function getWeatherInformation(
  hub: MessageHub,
  position: LonLat
): Promise<WeatherInfo | undefined> {
  if (!Array.isArray(position) || position.length < 2) {
    throw new Error('Invalid position');
  }

  const response = await hub.sendMessage<Response_WTHAT>({
    type: 'WTH-AT',
    position: toScaledJSONFromLonLat(position),
  });

  if (response.body && response.body.type === 'WTH-AT') {
    return response.body.weather;
  }

  throw new Error('Unexpected response for weather query');
}

/**
 * Returns the list of loaded extensions and the list of extensions known to
 * the server, in an object with keys named `loaded` and `available`.
 *
 * The response is cached for a short period of time (a few seconds).
 */
const listExtensions = memoize(
  async (hub: MessageHub): Promise<Response_EXTLIST> => {
    const response = await hub.sendMessage<Response_EXTLIST>('EXT-LIST');
    return response.body;
  },
  {
    maxAge: 5000 /* 5 seconds */,
    promise: true,
  }
);

/**
 * Checks whether the extension with the given name is currently loaded in
 * the server.
 *
 * @param name  the name of the extension
 *
 * @return whether the extension is loaded
 */
export async function isExtensionLoaded(
  hub: MessageHub,
  name: string
): Promise<boolean> {
  const extensions = await listExtensions(hub);

  if (Array.isArray(extensions?.loaded)) {
    return extensions.loaded.includes(name);
  }

  return false;
}

const _queries = {
  adaptShow,
  addCollectiveRTH,
  getBasicBeaconProperties,
  getConfigurationOfExtension,
  getFirmwareUpdateObjects,
  getFirmwareUpdateTargets,
  getFlightLog,
  getFlightLogList,
  getLicenseInformation,
  getMissionTypeSchemas,
  getMissionTypes,
  getPreflightStatus,
  getRTKPresets,
  getRTKStatus,
  getRTKSurveySettings,
  getSelectedRTKPresetId,
  getServerPortMapping,
  getShowConfiguration,
  getWeatherInformation,
  isExtensionLoaded,
  listExtensions,
};

type RemoveHubArg<F> = F extends (hub: MessageHub, ...args: infer A) => infer R
  ? (...args: A) => R
  : never;
export type QueryHandler = {
  [K in keyof typeof _queries]: RemoveHubArg<(typeof _queries)[K]>;
};

/**
 * Query handler object that can be used to initiate queries to a Flockwave
 * server using a given message hub.
 */
export const createQueryHandler = (hub: MessageHub): QueryHandler =>
  Object.fromEntries(
    Object.entries(_queries).map(([name, func]) => [
      name,
      // @ts-expect-error Correctly annotating this would require dependent
      //                  types, as each query has different arguments
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      (...args) => func(hub, ...args),
    ])
  ) as QueryHandler;
