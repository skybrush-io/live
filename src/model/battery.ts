import {
  DEFAULT_BATTERY_CELL_COUNT,
  LIPO_CRITICAL_VOLTAGE_THRESHOLD,
  LIPO_EMPTY_VOLTAGE,
  LIPO_FULL_CHARGE_VOLTAGE,
  LIPO_LOW_VOLTAGE_THRESHOLD,
} from './constants';

import { Status } from '@skybrush/app-theme-material-ui';

export enum BatteryStatus {
  FULL = 'Full',
  NEAR_FULL = 'NearFull',
  OK = 'Ok',
  WARNING = 'Warning',
  ERROR = 'Error',
  UNKNOWN = 'Unknown',
}

const batteryToSemanticStatus = {
  [BatteryStatus.FULL]: Status.OFF,
  [BatteryStatus.NEAR_FULL]: Status.OFF,
  [BatteryStatus.OK]: Status.OFF,
  [BatteryStatus.WARNING]: Status.WARNING,
  [BatteryStatus.ERROR]: Status.ERROR,
  [BatteryStatus.UNKNOWN]: Status.OFF,
} as const;

// Percentage thresholds for full, nearly full, normal and low battery levels
const percentageThresholds = {
  [BatteryStatus.FULL]: 95,
  [BatteryStatus.NEAR_FULL]: 60,
  [BatteryStatus.OK]: 20,
  [BatteryStatus.WARNING]: 10,
} as const;

/**
 * Settings object that encapsulates the standard properties of a battery, i.e.
 * the number of cells and the thresholds for the critical, low and full states.
 */
export class BatterySettings {
  /**
   * Default battery cell count to assume if the user did not provide a cell
   * count when submitting voltages to the functions of this class.
   */
  defaultBatteryCellCount: number;

  /**
   * Voltage of a fully charged battery cell, in volts.
   */
  fullChargeVoltage: number;

  /**
   * Voltage of a nearly fully charged battery cell, in volts.
   */
  nearFullChargeVoltage: number;

  /**
   * Voltage threshold for a battery cell that can be considered sort-of-charged, in volts.
   */
  okVoltageThreshold: number;

  /**
   * Low battery warning threshold (per cell), in volts.
   */
  lowVoltageThreshold: number;

  /**
   * Critical battery warning threshold (per cell), in volts.
   */
  criticalVoltageThreshold: number;

  /**
   * Voltage of an empty battery cell, in volts.
   */
  emptyVoltage: number;

  constructor({
    defaultBatteryCellCount = DEFAULT_BATTERY_CELL_COUNT,
    voltageThresholds: {
      full = LIPO_FULL_CHARGE_VOLTAGE,
      low = LIPO_LOW_VOLTAGE_THRESHOLD,
      critical = LIPO_CRITICAL_VOLTAGE_THRESHOLD,
      empty = LIPO_EMPTY_VOLTAGE,
    } = {},
  }: {
    defaultBatteryCellCount?: number;
    voltageThresholds?: {
      full?: number;
      low?: number;
      critical?: number;
      empty?: number;
    };
  } = {}) {
    this.defaultBatteryCellCount = defaultBatteryCellCount;

    // NOTE: The discrepancy between percentage and voltage thresholds
    //       is due to the non-linear discharge curve of the batteries.

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
  estimatePercentageFromVoltagePerCell = (voltagePerCell: number): number => {
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
  estimatePercentageFromVoltage = (
    voltage?: number,
    cellCount?: number
  ): number => {
    const voltagePerCell = this.getVoltagePerCell(voltage, cellCount);
    return this.estimatePercentageFromVoltagePerCell(voltagePerCell);
  };

  /**
   * Returns a suggested semantic status level corresponding to the state of the
   * battery. This can be used for components that accept a generic semantic
   * status level only. Use `getBatteryStatus()` for components that can
   * interpret a battery status level directly.
   */
  getSemanticBatteryStatus = (
    voltage?: number,
    percentage?: number,
    cellCount?: number
  ): Status => {
    const status = this.getBatteryStatus(voltage, percentage, cellCount);
    return batteryToSemanticStatus[status];
  };

  /**
   * Returns a suggested battery status level, given the voltage and charge
   * percentage of the battery and the number of cells in the battery.
   */
  getBatteryStatus = (
    voltage?: number,
    percentage?: number,
    cellCount?: number
  ): BatteryStatus => {
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
  getVoltagePerCell = (
    voltage?: number,
    cellCount: number = this.defaultBatteryCellCount
  ): number => (!voltage || cellCount < 1 ? 0 : voltage / cellCount);
}
