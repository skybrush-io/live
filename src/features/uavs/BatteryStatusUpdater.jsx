import isNil from 'lodash-es/isNil';
import mean from 'lodash-es/mean';
import min from 'lodash-es/min';
import PropTypes from 'prop-types';
import { useStore } from 'react-redux';
import { useInterval } from 'react-use';

import {
  getBatterySettings,
  getPreferredBatteryDisplayStyle,
} from '~/features/settings/selectors';
import { BatteryDisplayStyle } from '~/model/settings';

import { getActiveUAVIds, getUAVById } from './selectors';

const BatteryStatusUpdater = ({ onSetStatus }) => {
  const store = useStore();

  useInterval(() => {
    if (!onSetStatus) {
      return;
    }

    const state = store.getState();
    const settings = getBatterySettings(state);
    const preferredBatteryDisplayStyle = getPreferredBatteryDisplayStyle(state);

    const voltages = [];
    const percentages = [];

    for (const uavId of getActiveUAVIds(state)) {
      const battery = getUAVById(state, uavId)?.battery;

      if (battery) {
        if (!isNil(battery.voltage)) {
          voltages.push(battery.voltage);
        }

        if (!isNil(battery.percentage)) {
          percentages.push(battery.percentage);
        } else if (
          !isNil(battery.voltage) &&
          preferredBatteryDisplayStyle === BatteryDisplayStyle.FORCED_PERCENTAGE
        ) {
          percentages.push(
            settings.estimatePercentageFromVoltage(battery.voltage)
          );
        }
      }
    }

    // TODO(ntamas): figure out how to interpret percentages nicely if some of
    // the UAVs provide a percentage estimate and some of them provide a voltage
    // estimate.

    const getMeanAndMinOrNulls = (values) =>
      values.length > 0 ? [mean(values), min(values)] : [null, null];

    const [meanVoltage, minVoltage] = getMeanAndMinOrNulls(voltages);
    const [meanPercentage, minPercentage] = getMeanAndMinOrNulls(percentages);

    const getVoltageAndPercentageOrNull = (voltage, percentage) =>
      voltage !== null || percentage !== null ? { voltage, percentage } : null;

    onSetStatus({
      avg: getVoltageAndPercentageOrNull(meanVoltage, meanPercentage),
      min: getVoltageAndPercentageOrNull(minVoltage, minPercentage),
    });
  }, 1000);

  return null;
};

BatteryStatusUpdater.propTypes = {
  onSetStatus: PropTypes.func,
};

export default BatteryStatusUpdater;
