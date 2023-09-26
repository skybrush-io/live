import delay from 'delay';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';

import handleError from '~/error-handling';
import { updateRTKStatistics } from '~/features/rtk/slice';
import useMessageHub from '~/hooks/useMessageHub';

/**
 * Component that renders nothing but constantly queries the server for the
 * current RTK status and dispatches actions to update the local store.
 */
const RTKStatusUpdater = ({ onStatusChanged, period }) => {
  const messageHub = useMessageHub();

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
  }, [messageHub, onStatusChanged, period]);

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
      const { antenna = {}, messages = {}, cnr = {}, survey = {} } = status;
      const now = Date.now();

      let position;
      let positionECEF;
      let height;

      if (antenna.position) {
        position = [antenna.position[1] / 1e7, antenna.position[0] / 1e7];
        height =
          antenna.position[2] !== undefined
            ? antenna.position[2] / 1e3
            : undefined;
      }

      if (antenna.positionECEF) {
        positionECEF = Array.isArray(antenna.positionECEF)
          ? antenna.positionECEF.slice(0, 3).map((x) => Math.round(x))
          : undefined;
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
          messages: mapValues(messages, (messageStat) => ({
            lastUpdatedAt: now - messageStat[0],
            bitsPerSecond: messageStat[1],
          })),
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
