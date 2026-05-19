import createColor from 'color';
import type { CSSProperties } from 'react';

import { Status } from '~/components/semantics';

/** 90% 이상 — 진한 초록 */
export const DATALINK_COLOR_EXCELLENT = '#2e7d32';

/** 80–89% — 연초록 */
export const DATALINK_COLOR_GOOD = '#81c784';

/** 60–79% — 노랑 */
export const DATALINK_COLOR_FAIR = '#fbc02d';

/** 60% 미만 — 빨강 */
export const DATALINK_COLOR_POOR = '#f44336';

const isKnownRssi = (rssi?: number): rssi is number =>
  rssi !== undefined &&
  rssi !== null &&
  rssi >= 0 &&
  Number.isFinite(rssi);

/**
 * Returns the background color for a datalink (RSSI %) value.
 */
export function getDatalinkColor(rssi?: number): string | undefined {
  if (!isKnownRssi(rssi)) {
    return undefined;
  }

  if (rssi >= 90) {
    return DATALINK_COLOR_EXCELLENT;
  }

  if (rssi >= 80) {
    return DATALINK_COLOR_GOOD;
  }

  if (rssi >= 60) {
    return DATALINK_COLOR_FAIR;
  }

  return DATALINK_COLOR_POOR;
}

export function getDatalinkPillStyle(rssi?: number): CSSProperties | undefined {
  const backgroundColor = getDatalinkColor(rssi);

  if (!backgroundColor) {
    return undefined;
  }

  return {
    backgroundColor,
    color: createColor(backgroundColor).isLight() ? '#000' : '#fff',
  };
}

export function getSemanticsForDatalink(rssi?: number): Status {
  if (!isKnownRssi(rssi)) {
    return Status.OFF;
  }

  if (rssi >= 80) {
    return Status.SUCCESS;
  }

  if (rssi >= 60) {
    return Status.WARNING;
  }

  return Status.ERROR;
}
