/*
 * Selectors related to the snackbar of the application.
 */

/**
 * Selects the most recent fire-and-forget type of notification that was added
 * to the snackbar.
 */
export const selectActiveNotification = (state) => state.snackbar.notification;
