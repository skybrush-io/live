import delay from 'delay';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import { useEffect } from 'react';
import { connect } from 'react-redux';

import handleError from '~/error-handling';
import { autosaveCurrentCoordinateForPreset } from '~/features/rtk/actions';
import { updateRTKStatistics } from '~/features/rtk/slice';
import { hasValidFix } from '~/features/rtk/utils';
import { isConnected } from '~/features/servers/selectors';
import useMessageHub from '~/hooks/useMessageHub';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';
import type { Latitude, Longitude, LonLat } from '~/utils/geography';
import type { Coordinate3D } from '~/utils/math';

import { useHasRTKStatusSubscribers } from './subscription';
import type { RTKStatistics, RTKStatisticsResponse } from './types';

type Props = {
  isConnected: boolean;
  onStatusChanged: (status: RTKStatisticsResponse) => void;
  period?: number;
};

/**
 * Component that renders nothing but periodically queries the server for the
 * current RTK status and dispatches actions to update the local store, as
 * long as we are connected and at least one component subscribed to the
 * updates with `useRTKStatusSubscription()`.
 *
 * Must be mounted only once in the application.
 */
const RTKStatusUpdater = ({
  isConnected,
  onStatusChanged,
  period = 1000,
}: Props) => {
  const messageHub = useMessageHub();
  const dispatch = useAppDispatch();
  const hasSubscribers = useHasRTKStatusSubscribers();
  const enabled = isConnected && hasSubscribers;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const valueHolder: {
      finished: boolean;
      promise: Promise<void> | null;
    } = {
      finished: false,
      promise: null,
    };

    const checkAndAutosave = async (status: RTKStatisticsResponse) => {
      // Autosave base station coordinate on first valid fix per preset
      const rtkStatusForFixCheck: Pick<RTKStatistics, 'antenna' | 'survey'> = {
        antenna: {
          positionECEF: Array.isArray(status?.antenna?.positionECEF)
            ? (status.antenna.positionECEF
                .slice(0, 3)
                .map((x) => Math.round(x)) as Coordinate3D)
            : undefined,
        },
        survey: {
          accuracy:
            typeof status?.survey?.accuracy === 'number'
              ? status.survey.accuracy
              : undefined,
          flags:
            typeof status?.survey?.flags === 'number'
              ? status.survey.flags
              : undefined,
        },
      };
      if (!hasValidFix(rtkStatusForFixCheck)) {
        return;
      }

      const selectedPresetId: string | null =
        await messageHub.query.getSelectedRTKPresetId();

      if (selectedPresetId) {
        dispatch(
          autosaveCurrentCoordinateForPreset(
            selectedPresetId,
            status?.antenna?.positionECEF
          )
        );
      }
    };

    const updateStatus = async () => {
      while (!valueHolder.finished) {
        try {
          const status: RTKStatisticsResponse =
            await messageHub.query.getRTKStatus();

          // The effect may have been cleaned up while the query was in flight
          if (valueHolder.finished) {
            break;
          }

          onStatusChanged(status);
          await checkAndAutosave(status);
        } catch (error) {
          handleError(error, { operation: 'RTK status query', quiet: true });
        }

        await delay(period);
      }
    };

    valueHolder.promise = updateStatus();

    return () => {
      valueHolder.finished = true;
      valueHolder.promise = null;
    };
  }, [dispatch, enabled, messageHub, onStatusChanged, period]);

  return null;
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isConnected: isConnected(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onStatusChanged(status: RTKStatisticsResponse) {
      const {
        antenna = {},
        messages = {},
        messagesTx,
        cnr = {},
        survey = {},
      } = status;
      const now = Date.now();
      const messageStats: RTKStatistics['messages'] = {};
      const hasTxBandwidthInfo = messagesTx !== undefined;

      let position: LonLat | undefined;
      let positionECEF: Coordinate3D | undefined;
      let height;

      if (antenna.position) {
        position = [
          (antenna.position[1] / 1e7) as Longitude,
          (antenna.position[0] / 1e7) as Latitude,
        ];
        height =
          typeof antenna.position[2] === 'number'
            ? antenna.position[2] / 1e3
            : undefined;
      }

      if (antenna.positionECEF) {
        positionECEF = Array.isArray(antenna.positionECEF)
          ? (antenna.positionECEF
              .slice(0, 3)
              .map((x) => Math.round(x)) as Coordinate3D)
          : undefined;
      }

      /* Process bit rates of inbound messages */
      for (const [key, messageStat] of Object.entries(messages)) {
        const [timestamp, bitsPerSecond] = messageStat;
        const lastUpdatedAt = now - timestamp;
        messageStats[key] = {
          lastUpdatedAt,
          bitsPerSecondReceived: bitsPerSecond,
          bitsPerSecondTransferred: hasTxBandwidthInfo ? 0 : undefined,
        };
      }

      /* Process bit rates of outbound messages */
      for (const [key, messageStat] of Object.entries(messagesTx ?? {})) {
        const [timestamp, bitsPerSecond] = messageStat;
        const lastUpdatedAt = now - timestamp;
        let entry = messageStats[key];

        if (!entry) {
          entry = {
            lastUpdatedAt: now - timestamp,
            bitsPerSecondReceived: 0,
            bitsPerSecondTransferred: 0,
          };
          messageStats[key] = entry;
        }

        entry.lastUpdatedAt = Math.min(entry.lastUpdatedAt, lastUpdatedAt);
        entry.bitsPerSecondTransferred = bitsPerSecond;
      }

      dispatch(
        updateRTKStatistics({
          antenna: {
            descriptor: String(antenna.descriptor ?? ''),
            serialNumber: String(antenna.serialNumber ?? ''),
            stationId: isNil(antenna.stationId)
              ? undefined
              : Number(antenna.stationId),
            position,
            positionECEF,
            height,
          },
          messages: messageStats,
          satellites: mapValues(cnr, (cnrValue) => ({
            lastUpdatedAt: now,
            cnr: cnrValue,
          })),
          survey,
          lastUpdatedAt: now,
        })
      );
    },
  })
)(RTKStatusUpdater);
