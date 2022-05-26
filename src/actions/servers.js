/**
 * @file Action factories related to the management of detected servers.
 */

import { actions as authenticationActions } from '../reducers/dialogs/authentication';
import { actions as deauthenticationActions } from '../reducers/dialogs/deauthentication';

export const { closeAuthenticationDialog, showAuthenticationDialog } =
  authenticationActions;

export const { closeDeauthenticationDialog, showDeauthenticationDialog } =
  deauthenticationActions;
