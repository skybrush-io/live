import delay from 'delay';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';

import handleError from '~/error-handling';
import { saveCurrentCoordinateForPreset } from '~/features/rtk/actions';
import { updateRTKStatistics } from '~/features/rtk/slice';
import { hasValidFix, shouldSaveCoordinate } from '~/features/rtk/utils';
import useMessageHub from '~/hooks/useMessageHub';

/**
 * Component that renders nothing but constantly queries the server for the
 * current RTK status and dispatches actions to update the local store.
 */
const RTKStatusUpdater = ({ onStatusChanged, period = 1000 }) => {
  const messageHub = useMessageHub();
  const dispatch = useDispatch();
  const savedCoordinates = useSelector((state) => state.rtk.savedCoordinates);

  useEffect(() => {
    const valueHolder = {
      finished: false,
      promise: null,
    };

    const checkAndAutosave = async (status) => {
      // Autosave base station coordinate on first valid fix per preset
      if (!hasValidFix(status)) {
        return;
      }

      const selectedPresetId = await messageHub.query.getSelectedRTKPresetId();

      if (
        selectedPresetId &&
        shouldSaveCoordinate(status, savedCoordinates, selectedPresetId)
      ) {
        dispatch(saveCurrentCoordinateForPreset(selectedPresetId));
      }
    };

    const updateStatus = async () => {
      while (!valueHolder.finished) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const status = await messageHub.query.getRTKStatus();
          onStatusChanged(status);

          // eslint-disable-next-line no-await-in-loop
          await checkAndAutosave(status);
        } catch (error) {
          handleError(error, 'RTK status query');
        }

        // eslint-disable-next-line no-await-in-loop
        await delay(period);
      }
    };

    valueHolder.promise = updateStatus();

    return () => {
      valueHolder.finished = true;
      valueHolder.promise = null;
    };
  }, [messageHub, onStatusChanged, period, dispatch, savedCoordinates]);

  return null;
};

RTKStatusUpdater.propTypes = {
  onStatusChanged: PropTypes.func,
  period: PropTypes.number,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch) => ({
    onStatusChanged(status) {
      const {
        antenna = {},
        messages = {},
        messagesTx,
        cnr = {},
        survey = {},
      } = status;
      const now = Date.now();
      const messageStats = {};
      const hasTxBandwidthInfo = messagesTx !== undefined;

      let position;
      let positionECEF;
      let height;

      if (antenna.position) {
        position = [antenna.position[1] / 1e7, antenna.position[0] / 1e7];
        height =
          antenna.position[2] === undefined
            ? undefined
            : antenna.position[2] / 1e3;
      }

      if (antenna.positionECEF) {
        positionECEF = Array.isArray(antenna.positionECEF)
          ? antenna.positionECEF.slice(0, 3).map((x) => Math.round(x))
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
      for (const [key, messageStat] of Object.entries(messagesTx || {})) {
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
            descriptor: String(antenna.descriptor || ''),
            serialNumber: String(antenna.serialNumber || ''),
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
