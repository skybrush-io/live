import type { CSSProperties } from 'react';

/**
 * Shared column widths for the UAV list header and rows.
 * Includes horizontal margins on pills/filled cells (theme.spacing(0, 0.25) × 2).
 */
export const LIST_CELL_MARGIN_X = 4;

export const LIST_ID_COLUMNS = {
  missionIds: { primary: 48, secondary: 40 },
  droneIds: { primary: 48, secondary: 40 },
} as const;

export const LIST_DATA_COLUMN_WIDTHS = {
  status: 80 + LIST_CELL_MARGIN_X,
  alert: 44 + LIST_CELL_MARGIN_X,
  mode: 48 + LIST_CELL_MARGIN_X,
  battery: 62 + LIST_CELL_MARGIN_X,
  led: 12,
  rssi: 72 + LIST_CELL_MARGIN_X,
  gps: 40 + LIST_CELL_MARGIN_X,
  /** Sats value + gap before Path */
  sats: 28 + 16,
  /** Path pill + horizontal margins */
  path: 4 + 52 + LIST_CELL_MARGIN_X + 16,
  /** 25-char coordinate field + left inset before Position */
  position: 8 + 200,
  amsl: 58,
  ahl: 56,
  agl: 48,
  heading: 40,
} as const;

export const LIST_MIN_WIDTH =
  LIST_ID_COLUMNS.missionIds.primary +
  LIST_ID_COLUMNS.missionIds.secondary +
  Object.values(LIST_DATA_COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0);

export const listDataColumnStyle = (
  key: keyof typeof LIST_DATA_COLUMN_WIDTHS
): CSSProperties => ({
  flex: `0 0 ${LIST_DATA_COLUMN_WIDTHS[key]}px`,
  width: LIST_DATA_COLUMN_WIDTHS[key],
  minWidth: LIST_DATA_COLUMN_WIDTHS[key],
  maxWidth: LIST_DATA_COLUMN_WIDTHS[key],
  boxSizing: 'border-box',
});

export const listIdColumnStyle = (
  width: number,
  align: 'left' | 'right' = 'right'
): CSSProperties => ({
  flex: `0 0 ${width}px`,
  width,
  minWidth: width,
  maxWidth: width,
  boxSizing: 'border-box',
  textAlign: align,
});
