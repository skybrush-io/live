import createColor from 'color';
import type { CSSProperties } from 'react';

import {
  getSeverityOfMostSevereErrorCode,
  Severity,
} from '~/flockwave/errors';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import { Status } from '~/components/semantics';

import type { StoredUAV } from './types';

export enum VehicleMode {
  READY_TO_FLY = 'readyToFly',
  ARMED = 'armed',
  DISARMED = 'disarmed',
  OTHER = 'other',
}

/** 연초록 — ready to fly */
export const VEHICLE_MODE_COLOR_READY = '#81c784';

/** 진한 초록 — armed */
export const VEHICLE_MODE_COLOR_ARMED = '#2e7d32';

/** 붉은색 — disarmed */
export const VEHICLE_MODE_COLOR_DISARMED = '#f44336';

/** 노란색 — 기타 */
export const VEHICLE_MODE_COLOR_OTHER = '#fbc02d';

const isOnGround = (uav: StoredUAV): boolean =>
  !uav.position || Math.abs(uav.position.ahl ?? 0) < 0.3;

/**
 * Derives the vehicle mode of a UAV for list coloring.
 *
 * Priority: disarmed → armed → ready to fly → other.
 */
export function getVehicleMode(uav: StoredUAV): VehicleMode {
  const errors = uav.errors ?? [];

  if (errors.includes(UAVErrorCode.DISARMED)) {
    return VehicleMode.DISARMED;
  }

  if (errors.includes(UAVErrorCode.MOTORS_RUNNING_WHILE_ON_GROUND)) {
    return VehicleMode.ARMED;
  }

  const worstSeverity =
    errors.length > 0
      ? getSeverityOfMostSevereErrorCode(errors)
      : Severity.INFO;

  if (isOnGround(uav) && worstSeverity < Severity.WARNING) {
    return VehicleMode.READY_TO_FLY;
  }

  return VehicleMode.OTHER;
}

export function getVehicleModeColor(mode: VehicleMode): string {
  switch (mode) {
    case VehicleMode.READY_TO_FLY:
      return VEHICLE_MODE_COLOR_READY;
    case VehicleMode.ARMED:
      return VEHICLE_MODE_COLOR_ARMED;
    case VehicleMode.DISARMED:
      return VEHICLE_MODE_COLOR_DISARMED;
    default:
      return VEHICLE_MODE_COLOR_OTHER;
  }
}

export function getVehicleModePillStyle(mode: VehicleMode): CSSProperties {
  const backgroundColor = getVehicleModeColor(mode);
  return {
    backgroundColor,
    color: createColor(backgroundColor).isLight() ? '#000' : '#fff',
  };
}

export function getVehicleModeSemantics(mode: VehicleMode): Status {
  switch (mode) {
    case VehicleMode.DISARMED:
      return Status.ERROR;
    case VehicleMode.ARMED:
    case VehicleMode.READY_TO_FLY:
      return Status.SUCCESS;
    default:
      return Status.WARNING;
  }
}
