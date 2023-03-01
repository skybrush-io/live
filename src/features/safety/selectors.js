/**
 * Selector that returns whether the safety dialog is open.
 */
export const isSafetyDialogOpen = (state) => state.safety.dialog.open;

/**
 * Selector that determines the selected tab of the safety dialog.
 */
export const getSelectedTabInSafetyDialog = (state) =>
  state.safety.dialog.selectedTab;

/**
 * Selector that returns the currently set safety preferences of the user.
 */
export const getSafetySettings = (state) => state.safety.settings;
