import isNil from 'lodash-es/isNil';

import {
  DEFAULT_BATTERY_CELL_COUNT,
  LIPO_FULL_CHARGE_VOLTAGE,
  LIPO_LOW_VOLTAGE_THRESHOLD,
  LIPO_CRITICAL_VOLTAGE_THRESHOLD,
} from './constants';

import { Status } from '@skybrush/app-theme-material-ui';

export const BatteryStatus = {
  FULL: 'Full',
  NEAR_FULL: 'NearFull',
  OK: 'Ok',
  WARNING: 'Warning',
  ERROR: 'Error',
  UNKNOWN: 'Unknown',
};

const batteryToSemanticStatus = {
  [BatteryStatus.FULL]: Status.OFF,
  [BatteryStatus.NEAR_FULL]: Status.OFF,
  [BatteryStatus.OK]: Status.OFF,
  [BatteryStatus.WARNING]: Status.WARNING,
  [BatteryStatus.ERROR]: Status.ERROR,
  [BatteryStatus.UNKNOWN]: Status.OFF,
};

// Percentage thresholds for full, nearly full, normal and low battery levels
const percentageThresholds = {
  [BatteryStatus.FULL]: 95,
  [BatteryStatus.NEAR_FULL]: 60,
  [BatteryStatus.OK]: 20,
  [BatteryStatus.WARNING]: 10,
};

/**
 * Settings object that encapsulates the standard properties of a battery, i.e.
 * the number of cells and the thresholds for the critical, low and full states.
 */
export class BatterySettings {
  /**
   * Default battery cell count to assume if the user did not provide a cell
   * count when submitting voltages to the functions of this class.
   */
  defaultBatteryCellCount = DEFAULT_BATTERY_CELL_COUNT;

  /**
   * Voltage of a fully charged battery cell, in volts.
   */
  fullChargeVoltage = LIPO_FULL_CHARGE_VOLTAGE;

  /**
   * Voltage of a nearly fully charged battery cell, in volts.
   */
  nearFullChargeVoltage =
    LIPO_FULL_CHARGE_VOLTAGE -
    (LIPO_FULL_CHARGE_VOLTAGE - LIPO_LOW_VOLTAGE_THRESHOLD) * 0.1;

  /**
   * Voltage threshold for a battery cell that can be considered sort-of-charged, in volts.
   */
  okVoltageThreshold =
    LIPO_FULL_CHARGE_VOLTAGE -
    (LIPO_FULL_CHARGE_VOLTAGE - LIPO_LOW_VOLTAGE_THRESHOLD) * 0.4;

  /**
   * Low battery warning threshold (per cell), in volts.
   */
  lowVoltageThreshold = LIPO_LOW_VOLTAGE_THRESHOLD;

  /**
   * Critical battery warning threshold (per cell), in volts.
   */
  criticalVoltageThreshold = LIPO_CRITICAL_VOLTAGE_THRESHOLD;

  /**
   * Voltage of an empty battery cell, in volts.
   */
  emptyVoltage = 3.3;

  constructor({
    defaultBatteryCellCount = DEFAULT_BATTERY_CELL_COUNT,
    voltageThresholds,
  } = {}) {
    this.defaultBatteryCellCount = defaultBatteryCellCount;

    const { full, low, critical, empty } = {
      full: LIPO_FULL_CHARGE_VOLTAGE,
      low: LIPO_LOW_VOLTAGE_THRESHOLD,
      critical: LIPO_CRITICAL_VOLTAGE_THRESHOLD,
      empty: 3.3,
      ...voltageThresholds,
    };

    this.fullChargeVoltage = full;
    this.nearFullChargeVoltage = full - (full - low) * 0.1;
    this.okVoltageThreshold = full - (full - low) * 0.4;
    this.lowVoltageThreshold = low;
    this.criticalVoltageThreshold = Math.min(critical, low);
    this.emptyVoltage = Math.min(empty, this.criticalVoltageThreshold);
  }

  /**
   * Estimates a rough battery charge percentage, given the voltage per cell and
   * the battery thresholds in this class instance.
   */
  estimatePercentageFromVoltagePerCell = (voltagePerCell) => {
    if (voltagePerCell <= this.emptyVoltage) {
      return 0;
    } else if (voltagePerCell >= this.fullChargeVoltage) {
      return 100;
    } else {
      return Math.round(
        ((voltagePerCell - this.emptyVoltage) /
          (this.fullChargeVoltage - this.emptyVoltage)) *
          100
      );
    }
  };

  /**
   * Estimates a rough battery charge percentage, given the total voltage of the
   * battery and the number of cells.
   */
  estimatePercentageFromVoltage = (voltage, cellCount) => {
    const voltagePerCell = this.getVoltagePerCell(voltage, cellCount);
    return this.estimatePercentageFromVoltagePerCell(voltagePerCell);
  };

  /**
   * Returns a suggested semantic status level corresponding to the state of the
   * battery. This can be used for components that accept a generic semantic
   * status level only. Use `getBatteryStatus()` for components that can
   * interpret a battery status level directly.
   */
  getSemanticBatteryStatus = (voltage, percentage, cellCount) => {
    const status = this.getBatteryStatus(voltage, percentage, cellCount);
    return batteryToSemanticStatus[status] || Status.OFF;
  };

  /**
   * Returns a suggested battery status level, given the voltage and charge
   * percentage of the battery and the number of cells in the battery.
   */
  getBatteryStatus = (voltage, percentage, cellCount) => {
    if (percentage) {
      return percentage > percentageThresholds[BatteryStatus.FULL]
        ? BatteryStatus.FULL
        : percentage > percentageThresholds[BatteryStatus.NEAR_FULL]
        ? BatteryStatus.NEAR_FULL
        : percentage > percentageThresholds[BatteryStatus.OK]
        ? BatteryStatus.OK
        : percentage > percentageThresholds[BatteryStatus.WARNING]
        ? BatteryStatus.WARNING
        : BatteryStatus.ERROR;
    }

    const voltagePerCell = this.getVoltagePerCell(voltage, cellCount);
    return voltagePerCell > this.nearFullChargeVoltage
      ? BatteryStatus.FULL
      : voltagePerCell >= this.okVoltageThreshold
      ? BatteryStatus.NEAR_FULL
      : voltagePerCell >= this.lowVoltageThreshold
      ? BatteryStatus.OK
      : voltagePerCell >= this.criticalVoltageThreshold
      ? BatteryStatus.WARNING
      : BatteryStatus.ERROR;
  };

  /**
   * Returns the voltage per cell in a battery, given the voltage and an
   * optional cell count. Falls back to the default cell count of the class if
   * the cell count is not specified.
   */
  getVoltagePerCell = (voltage, cellCount) => {
    if (cellCount === undefined) {
      cellCount = this.defaultBatteryCellCount || 3;
    }

    return voltage === undefined || cellCount < 1 ? 0 : voltage / cellCount;
  };
}

const replaceNaN = (number, fallback) =>
  Number.isNaN(number) ? fallback : number;

const EMPTY_ARRAY = [];

/**
 * Helper function to convert a battery status array object typically seen in
 * UAV-INF or LPS-INF messages to a more descriptive object with proper keys.
 */
export function convertBatteryStatusArrayToObject(batteryStatus) {
  if (isNil(batteryStatus)) {
    batteryStatus = EMPTY_ARRAY;
  } else if (!Array.isArray(batteryStatus)) {
    console.warn(
      'Non-array passed in to convertBatteryStatusArrayToObject(); ignoring'
    );
    batteryStatus = EMPTY_ARRAY;
  }

  return {
    voltage:
      batteryStatus.length > 0 && !isNil(batteryStatus[0])
        ? replaceNaN(Number.parseInt(batteryStatus[0], 10) / 10, null)
        : null,
    percentage:
      batteryStatus.length > 1 && !isNil(batteryStatus[1])
        ? replaceNaN(Number.parseInt(batteryStatus[1], 10), null)
        : null,
    charging: batteryStatus.length > 2 ? Boolean(batteryStatus[2]) : false,
  };
}

/**
 * Helper function to update the status of an object holding battery
 * information (whose shape conforms to CustomPropTypes.batteryStatus) from
 * an object coming from the server in an UAV-INF or LPS-INF message.
 *
 * @param {object} batteryStatus  the status object to update in-place
 * @param {object[]} updates        the updates to merge into the status object.
 *        Must be an array with 2-3 items: voltage, percentage, charging state
 * @return whether the battery status object was updated
 */
export function updateBatteryStatus(batteryStatus, updates) {
  if (isNil(updates)) {
    return false;
  }

  if (!Array.isArray(updates)) {
    console.warn('Non-array passed in to updateBatteryStatus(); ignoring');
    return false;
  }

  let updated = false;

  const newVoltage =
    updates.length > 0 && !isNil(updates[0])
      ? replaceNaN(Number.parseInt(updates[0], 10) / 10, null)
      : null;
  const newPercentage =
    updates.length > 1 && !isNil(updates[1])
      ? replaceNaN(Number.parseInt(updates[1], 10), null)
      : null;
  const newCharging = updates.length > 2 ? Boolean(updates[2]) : false;

  if (newPercentage !== batteryStatus.percentage) {
    batteryStatus.percentage = newPercentage;
    updated = true;
  }

  if (newVoltage !== batteryStatus.voltage) {
    batteryStatus.voltage = newVoltage;
    updated = true;
  }

  if (newCharging !== batteryStatus.charging) {
    batteryStatus.charging = newCharging;
    updated = true;
  }

  return updated;
}
