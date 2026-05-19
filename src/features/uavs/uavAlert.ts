import createColor from 'color';
import type { CSSProperties } from 'react';

import { Status } from '~/components/semantics';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import { GPSFixType } from '~/model/enums';

import { resolveBatteryPercentage } from './batteryLevel';
import {
  isPathUploadedForUav,
  type PathUploadContext,
} from './pathUpload';
import type { StoredUAV } from './types';
import { getVehicleMode, VehicleMode } from './vehicleMode';
import {
  VEHICLE_MODE_COLOR_READY as ALERT_COLOR_GREEN,
  VEHICLE_MODE_COLOR_DISARMED as ALERT_COLOR_RED,
  VEHICLE_MODE_COLOR_OTHER as ALERT_COLOR_YELLOW,
} from './vehicleMode';

export enum UavAlertLevel {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
}

export type UavAlertContext = PathUploadContext &
  Readonly<{
    batteryPercentage?: number;
    geofenceRequired?: boolean;
    geofenceSet?: boolean;
    showStartTimeSet?: boolean;
    uploadStatus?: Status;
  }>;

export type UavAlertResult = Readonly<{
  level: UavAlertLevel;
  label: string;
  title: string;
}>;

const LOW_BATTERY_THRESHOLD = 35;

const RED_REASON_ORDER = [
  'BAT',
  'GYRO',
  'COMP',
  'CAL',
  'GEO',
  'PATH',
  'GPS',
] as const;

const RED_REASON_TITLES: Record<(typeof RED_REASON_ORDER)[number], string> = {
  BAT: 'Low battery',
  GYRO: 'Gyro error',
  COMP: 'Compass error',
  CAL: 'Calibration required',
  GEO: 'Geofence not set',
  PATH: 'Path not uploaded',
  GPS: 'No GPS',
};

const BATTERY_ERROR_CODES: readonly UAVErrorCode[] = [
  UAVErrorCode.BATTERY_LOW_WARNING,
  UAVErrorCode.BATTERY_LOW_ERROR,
  UAVErrorCode.BATTERY_CRITICAL,
];

const GPS_ERROR_CODES: readonly UAVErrorCode[] = [
  UAVErrorCode.GPS_SIGNAL_LOST,
  UAVErrorCode.GPS_SIGNAL_LOST_CRITICAL,
  UAVErrorCode.NO_GPS_HOME_POSITION,
];

const hasAnyError = (errors: readonly number[], codes: readonly number[]): boolean =>
  codes.some((code) => errors.includes(code));

const collectRedReasons = (
  uav: StoredUAV,
  ctx: UavAlertContext
): Array<(typeof RED_REASON_ORDER)[number]> => {
  const errors = uav.errors ?? [];
  const reasons: Array<(typeof RED_REASON_ORDER)[number]> = [];

  if (
    hasAnyError(errors, BATTERY_ERROR_CODES) ||
    (ctx.batteryPercentage !== undefined &&
      ctx.batteryPercentage < LOW_BATTERY_THRESHOLD)
  ) {
    reasons.push('BAT');
  }

  if (errors.includes(UAVErrorCode.GYROSCOPE_ERROR)) {
    reasons.push('GYRO');
  }

  if (errors.includes(UAVErrorCode.MAGNETIC_ERROR)) {
    reasons.push('COMP');
  }

  if (
    errors.includes(UAVErrorCode.RC_NOT_CALIBRATED) ||
    errors.includes(UAVErrorCode.PREARM_CHECK_FAILURE)
  ) {
    reasons.push('CAL');
  }

  if (ctx.geofenceRequired && !ctx.geofenceSet) {
    reasons.push('GEO');
  }

  if (!isPathUploadedForUav(uav, ctx.uploadStatus, ctx)) {
    reasons.push('PATH');
  }

  const gpsFixType = uav.gpsFix?.type;
  if (
    hasAnyError(errors, GPS_ERROR_CODES) ||
    gpsFixType === GPSFixType.NO_GPS ||
    gpsFixType === GPSFixType.NO_FIX
  ) {
    reasons.push('GPS');
  }

  return reasons;
};

const pickPrimaryRedReason = (
  reasons: Array<(typeof RED_REASON_ORDER)[number]>
): (typeof RED_REASON_ORDER)[number] =>
  RED_REASON_ORDER.find((reason) => reasons.includes(reason)) ?? reasons[0]!;

export function getUavAlert(
  uav: StoredUAV | undefined,
  ctx: UavAlertContext = {}
): UavAlertResult {
  if (!uav) {
    return {
      level: UavAlertLevel.RED,
      label: '—',
      title: 'No UAV data',
    };
  }

  const redReasons = collectRedReasons(uav, ctx);
  if (redReasons.length > 0) {
    const primary = pickPrimaryRedReason(redReasons);
    const title =
      redReasons.length > 1
        ? redReasons.map((reason) => RED_REASON_TITLES[reason]).join(', ')
        : RED_REASON_TITLES[primary];

    return {
      level: UavAlertLevel.RED,
      label: primary,
      title,
    };
  }

  if (!ctx.showStartTimeSet) {
    return {
      level: UavAlertLevel.YELLOW,
      label: 'TIME',
      title: 'Time not set',
    };
  }

  if (getVehicleMode(uav) === VehicleMode.READY_TO_FLY) {
    return {
      level: UavAlertLevel.GREEN,
      label: 'OK',
      title: 'Ready to fly',
    };
  }

  return {
    level: UavAlertLevel.YELLOW,
    label: 'WAIT',
    title: 'Not ready to fly',
  };
}

export function getUavAlertColor(level: UavAlertLevel): string {
  switch (level) {
    case UavAlertLevel.GREEN:
      return ALERT_COLOR_GREEN;
    case UavAlertLevel.YELLOW:
      return ALERT_COLOR_YELLOW;
    default:
      return ALERT_COLOR_RED;
  }
}

export function getUavAlertPillStyle(level: UavAlertLevel): CSSProperties {
  const backgroundColor = getUavAlertColor(level);

  return {
    backgroundColor,
    color: createColor(backgroundColor).isLight() ? '#000' : '#fff',
  };
}

export function getUavAlertSemantics(level: UavAlertLevel): Status {
  switch (level) {
    case UavAlertLevel.GREEN:
      return Status.SUCCESS;
    case UavAlertLevel.YELLOW:
      return Status.WARNING;
    default:
      return Status.ERROR;
  }
}

export type UavAlertBatteryInput = Readonly<{
  cellCount?: number;
  percentage?: number | string;
  voltage?: number | string;
  estimatePercentageFromVoltage?: (
    voltage?: number,
    cellCount?: number
  ) => number;
}>;

export function resolveUavAlertBatteryPercentage(
  battery?: UavAlertBatteryInput
): number | undefined {
  if (!battery) {
    return undefined;
  }

  return resolveBatteryPercentage(
    battery.percentage,
    battery.voltage,
    battery.estimatePercentageFromVoltage,
    battery.cellCount
  );
}
