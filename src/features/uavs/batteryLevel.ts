import createColor from 'color';
import type { CSSProperties } from 'react';

import {
  DATALINK_COLOR_EXCELLENT as BATTERY_LEVEL_COLOR_HIGH,
  DATALINK_COLOR_FAIR as BATTERY_LEVEL_COLOR_MID,
  DATALINK_COLOR_POOR as BATTERY_LEVEL_COLOR_LOW,
} from './datalink';

const toFiniteNumber = (value?: number | string): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

/**
 * Resolves battery charge percentage for list coloring.
 */
export function resolveBatteryPercentage(
  percentage?: number | string,
  voltage?: number | string,
  estimatePercentageFromVoltage?: (
    voltage?: number,
    cellCount?: number
  ) => number,
  cellCount?: number
): number | undefined {
  const fromTelemetry = toFiniteNumber(percentage);
  if (fromTelemetry !== undefined) {
    return fromTelemetry;
  }

  const numericVoltage = toFiniteNumber(voltage);
  if (numericVoltage !== undefined && estimatePercentageFromVoltage) {
    return estimatePercentageFromVoltage(numericVoltage, cellCount);
  }

  return undefined;
}

/** 80–100% */
export function getBatteryLevelColor(percentage: number): string {
  if (percentage >= 80) {
    return BATTERY_LEVEL_COLOR_HIGH;
  }

  if (percentage >= 35) {
    return BATTERY_LEVEL_COLOR_MID;
  }

  return BATTERY_LEVEL_COLOR_LOW;
}

export function getBatteryLevelStyle(percentage?: number): CSSProperties | undefined {
  if (percentage === undefined) {
    return undefined;
  }

  const backgroundColor = getBatteryLevelColor(percentage);

  return {
    backgroundColor,
    color: createColor(backgroundColor).isLight() ? '#000' : '#fff',
  };
}
