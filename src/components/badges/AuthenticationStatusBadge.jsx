/**
 * @file Smart badge component that shows the authentication status of the
 * current server.
 */

import { connect } from 'react-redux';

import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import {
  isAuthenticated,
  isAuthenticating,
  requiresAuthentication,
} from '~/features/servers/selectors';

const colorForState = {
  authenticated: Colors.success,
  authenticating: Colors.warning,
  notAuthenticated: Colors.error,
  authenticationNotRequired: undefined,
};

/**
 * Smart badge component that colors and shows itself according to the
 * status of all the connections reported by the server.
 */
export default connect(
  // mapStateToProps
  (state) => {
    const authState = isAuthenticated(state)
      ? 'authenticated'
      : isAuthenticating(state)
      ? 'authenticating'
      : requiresAuthentication(state)
      ? 'notAuthenticated'
      : 'authenticationNotRequired';
    const color = colorForState[authState];
    return {
      color,
      visible: color !== undefined,
    };
  },
  // Return empty object from mapDispatchToProps to avoid invalid prop warning
  // caused by react-badger not handling the automatically added dispatch prop.
  {}
)(SidebarBadge);
