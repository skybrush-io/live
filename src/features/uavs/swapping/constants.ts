/**
 * Width of the pending swap queue column of the swap drones dialog, including its
 * separator and the spacing around it.
 */
export const SWAP_DRONES_QUEUE_COLUMN_WIDTH = 240;

/**
 * Minimum height of the area below the drone fields of the swap drones dialog,
 * enough to show the preview heading and three preview lines without resizing
 * the dialog: 16px top padding + 22px heading + 3 x 38px lines + 3 x 8px gaps + 8px
 * just in case :)
 */
export const SWAP_DRONES_PREVIEW_AREA_MIN_HEIGHT = 184;

/**
 * Minimum height of the action bars at the bottom of the main area and the queue
 * sidebar of the swap drones dialog, so that their buttons line up: the height of
 * a checkbox (42px) plus the padding of `DialogActions` (2 x 8px).
 */
export const SWAP_DRONES_DIALOG_ACTIONS_MIN_HEIGHT = 58;

/**
 * Colors of the drone fields in the swap drones dialog, depending on their side.
 */
export const FIELD_COLORS = {
  left: 'warning.main',
  right: 'success.main',
} as const;
