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
 * Colors of the drone fields in the swap drones dialog, depending on their side.
 */
export const FIELD_COLORS = {
  left: 'warning.main',
  right: 'success.main',
} as const;
