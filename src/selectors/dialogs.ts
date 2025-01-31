import type { RootState } from '~/store/reducers';

/**
 * Creates a selector that returns whether the dialog with the given
 * identifier in the state store is open.
 */
const isDialogOpen =
  (name: 'appSettings' | 'authentication') => (state: RootState) =>
    state.dialogs[name] && state.dialogs[name].open;

/**
 * Selector that returns whether the authentication dialog is visible.
 */
export const isAuthenticationDialogOpen = isDialogOpen('authentication');
