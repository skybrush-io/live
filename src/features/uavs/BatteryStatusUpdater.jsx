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
    const percentages = [];

    for (const uavId of getActiveUAVIds(state)) {
      const uav = getUAVById(state, uavId);
      const battery = uav?.battery;
      if (battery) {
        if (!isNil(battery.voltage)) {
          voltages.push(battery.voltage);
        }
        if (!isNil(battery.percentage)) {
          percentages.push(battery.percentage);
        }
      }
    }

    // TODO(ntamas): figure out how to interpret percentages nicely if some of
    // the UAVs provide a percentage estimate and some of them provide a voltage
    // estimate.

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
    } else if (percentages.length > 0) {
      const meanPercentage = mean(percentages);
      const minPercentage = min(percentages);
      onSetStatus({
        avg: {
          voltage: null,
          percentage: meanPercentage,
        },
        min: {
          voltage: null,
          percentage: minPercentage,
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
