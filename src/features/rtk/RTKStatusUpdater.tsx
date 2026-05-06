import delay from 'delay';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import { useEffect } from 'react';
import { connect, useSelector } from 'react-redux';

import handleError from '~/error-handling';
import { saveCurrentCoordinateForPreset } from '~/features/rtk/actions';
import { getSavedCoordinates } from '~/features/rtk/selectors';
import { updateRTKStatistics } from '~/features/rtk/slice';
import { hasValidFix, shouldSaveCoordinate } from '~/features/rtk/utils';
import useMessageHub from '~/hooks/useMessageHub';
import { useAppDispatch } from '~/store/hooks';
import type { Latitude, Longitude, LonLat } from '~/utils/geography';
import type { Coordinate3D } from '~/utils/math';

import type { RTKStatistics, RTKStatisticsResponse } from './types';

type Props = {
  onStatusChanged: (status: RTKStatisticsResponse) => void;
  period?: number;
};

/**
 * Component that renders nothing but constantly queries the server for the
 * current RTK status and dispatches actions to update the local store.
 */
const RTKStatusUpdater = ({ onStatusChanged, period = 1000 }: Props) => {
  const messageHub = useMessageHub();
  const dispatch = useAppDispatch();
  const savedCoordinates = useSelector(getSavedCoordinates);

  useEffect(() => {
    const valueHolder: {
      finished: boolean;
      promise: Promise<void> | null;
    } = {
      finished: false,
      promise: null,
    };

    const checkAndAutosave = async (status: RTKStatisticsResponse) => {
      // Autosave base station coordinate on first valid fix per preset
      if (!hasValidFix(status as RTKStatistics)) {
        return;
      }

      const selectedPresetId: string | null =
        await messageHub.query.getSelectedRTKPresetId();

      if (
        selectedPresetId &&
        shouldSaveCoordinate(
          status?.antenna?.positionECEF,
          savedCoordinates,
          selectedPresetId
        )
      ) {
        dispatch(saveCurrentCoordinateForPreset(selectedPresetId));
      }
    };

    const updateStatus = async () => {
      while (!valueHolder.finished) {
        try {
          const status: RTKStatisticsResponse =
            await messageHub.query.getRTKStatus();
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
  }, [dispatch, messageHub, onStatusChanged, period, savedCoordinates]);

  return null;
};

export default connect(
  // mapStateToProps
  null,
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
