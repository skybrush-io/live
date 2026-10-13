/**
 * Width of the drone selector column of the swap drones dialog. Kept constant so
 * that showing or hiding the pending swap queue does not reflow the form.
 */
export const SWAP_DRONES_FORM_COLUMN_WIDTH = 550;

/**
 * Width of the pending swap queue column of the swap drones dialog, including its
 * separator and the spacing around it.
 */
export const SWAP_DRONES_QUEUE_COLUMN_WIDTH = 200;

/**
 * Minimum height of the area below the drone fields of the swap drones dialog,
 * enough to show the preview heading and three preview lines without resizing
 * the dialog: 16px top padding + 22px heading + 3 x 38px lines + 3 x 8px gaps + 8px
 * just in case :)
 */
export const SWAP_DRONES_PREVIEW_AREA_MIN_HEIGHT = 184;

/**
 * Colors of the drone fields in the swap drones dialog, depending on their side.
 */
export const FIELD_COLORS = {
  left: 'warning.main',
  right: 'success.main',
} as const;
