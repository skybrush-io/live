/**
 * Creates a selector that returns whether the dialog with the given
 * identifier in the state store is open.
 *
 * @param  {string}  name  name of the dialog to query
 * @return {function} a selector function that takes the application state and
 *         returns whether the dialog with the given name is open
 */
const isDialogOpen = (name) => (state) =>
  state.dialogs[name] && state.dialogs[name].open;

/**
 * Selector that returns whether the authentication dialog is visible.
 */
export const isAuthenticationDialogOpen = isDialogOpen('authentication');
