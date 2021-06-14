import isNil from 'lodash-es/isNil';
import mean from 'lodash-es/mean';
import min from 'lodash-es/min';
import PropTypes from 'prop-types';
import { useStore } from 'react-redux';
import { useInterval } from 'react-use';

import { getBatterySettings } from '~/features/settings/selectors';

import { getActiveUAVIds, getUAVById } from './selectors';

const BatteryStatusUpdater = ({ onSetStatus }) => {
  const store = useStore();

  useInterval(() => {
    if (!onSetStatus) {
      return;
    }

    const state = store.getState();
    const voltages = [];

    for (const uavId of getActiveUAVIds(state)) {
      const uav = getUAVById(state, uavId);
      const battery = uav?.battery;
      if (battery && !isNil(battery.voltage)) {
        voltages.push(battery.voltage);
      }
    }

    // TODO(ntamas): figure out how to interpret percentages nicely if some of
    // the UAVs provide a percentage estimate. Maybe if all the UAVs provide a
    // percentage, then we should use that, otherwise we should use voltages?

    if (voltages.length > 0) {
      const settings = getBatterySettings(state);
      const meanVoltage = mean(voltages);
      const minVoltage = min(voltages);
      onSetStatus({
        avg: {
          voltage: meanVoltage,
          percentage: settings.estimatePercentageFromVoltage(meanVoltage),
        },
        min: {
          voltage: minVoltage,
          percentage: settings.estimatePercentageFromVoltage(minVoltage),
        },
      });
    } else {
      onSetStatus(
        {
          avg: null,
        },
        {
          min: null,
        }
      );
    }
  }, 1000);

  return null;
};

BatteryStatusUpdater.propTypes = {
  onSetStatus: PropTypes.func,
};

export default BatteryStatusUpdater;
