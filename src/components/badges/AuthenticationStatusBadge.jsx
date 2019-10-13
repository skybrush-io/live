/**
 * @file Smart badge component that shows the authentication status of the
 * current server.
 */

import { connect } from 'react-redux';

import SidebarBadge from './SidebarBadge';

import {
  isAuthenticated,
  isAuthenticating,
  requiresAuthentication
} from '~/selectors/servers';

const colorForState = {
  authenticated: '#0c0',
  authenticating: '#fc0',
  notAuthenticated: '#f00',
  authenticationNotRequired: undefined
};

/**
 * Smart badge component that colors and shows itself according to the
 * status of all the connections reported by the server.
 */
export default connect(
  // mapStateToProps
  state => {
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
      visible: color !== undefined
    };
  },
  // Return empty object from mapDispatchToProps to avoid invalid prop warning
  // caused by react-badger not handling the automatically added dispatch prop.
  () => ({})
)(SidebarBadge);
