import { createNextState } from '@reduxjs/toolkit';
import { createMigrate } from 'redux-persist';

import { BatteryThresholdType } from '~/features/safety/model';
import {
  DEFAULT_BATTERY_CELL_COUNT,
  LIPO_CRITICAL_VOLTAGE_THRESHOLD,
  LIPO_FULL_CHARGE_VOLTAGE,
  LIPO_LOW_VOLTAGE_THRESHOLD,
} from '~/model/constants';

const migrations = {
  2: createNextState((state) => {
    state.settings.uavs = {
      ...state.settings.uavs,
      defaultBatteryCellCount: DEFAULT_BATTERY_CELL_COUNT,
      fullChargeVoltage: LIPO_FULL_CHARGE_VOLTAGE,
      lowVoltageThreshold: LIPO_LOW_VOLTAGE_THRESHOLD,
      criticalVoltageThreshold: LIPO_CRITICAL_VOLTAGE_THRESHOLD,
    };
  }),
  3: createNextState((state) => {
    if (typeof state.safety.settings.lowBatteryVoltage === 'number') {
      state.safety.settings.lowBatteryThreshold = {
        type: BatteryThresholdType.VOLTAGE,
        value: state.safety.settings.lowBatteryVoltage,
      };
    }
  }),
};

export default createMigrate(migrations);
