import delay from 'delay';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';

import handleError from '~/error-handling';
import { updateRTKStatistics } from '~/features/rtk/slice';
import { saveCurrentCoordinateForPreset } from '~/features/rtk/actions';
import useMessageHub from '~/hooks/useMessageHub';

/**
 * Component that renders nothing but constantly queries the server for the
 * current RTK status and dispatches actions to update the local store.
 */
const RTKStatusUpdater = ({ onStatusChanged, period }) => {
  const messageHub = useMessageHub();
  const dispatch = useDispatch();
  const savedCoordinates = useSelector((state) => state.rtk.savedCoordinates);

  useEffect(() => {
    const valueHolder = {
      finished: false,
      promise: null,
    };

    const updateStatus = async () => {
      while (!valueHolder.finished) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const status = await messageHub.query.getRTKStatus();
          onStatusChanged(status);

          // Autosave base station coordinate on first valid fix per preset
          const hasECEF = Array.isArray(status?.antenna?.positionECEF);
          const accuracy = status?.survey?.accuracy;
          const flags = status?.survey?.flags;
          const surveyedCoordinateValid =
            typeof flags === 'number' ? (flags & 0b100) !== 0 : false;
          const hasValidFix =
            hasECEF &&
            (surveyedCoordinateValid || typeof accuracy === 'number');

          if (hasValidFix) {
            const selectedPresetId =
              // eslint-disable-next-line no-await-in-loop
              await messageHub.query.getSelectedRTKPresetId();
            if (!selectedPresetId) {
              continue;
            }

            const incomingECEF = Array.isArray(status?.antenna?.positionECEF)
              ? status.antenna.positionECEF
                  .slice(0, 3)
                  .map((x) => Math.round(x))
              : undefined;
            const saved =
              savedCoordinates && savedCoordinates[selectedPresetId];
            const savedECEF =
              saved && Array.isArray(saved.positionECEF)
                ? saved.positionECEF.slice(0, 3)
                : undefined;

            const isSameECEF =
              incomingECEF && savedECEF
                ? incomingECEF.length === savedECEF.length &&
                  incomingECEF.every((v, i) => v === savedECEF[i])
                : false;

            if (!isSameECEF) {
              dispatch(saveCurrentCoordinateForPreset(selectedPresetId));
            }
          }
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

RTKStatusUpdater.defaultProps = {
  period: 1000,
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
