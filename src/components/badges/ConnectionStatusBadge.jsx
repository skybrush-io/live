/**
 * @file Smart badge component that colors and shows itself according to the
 * status of all the connections reported by the server.
 */

import countBy from 'lodash-es/countBy';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import { ConnectionState } from '~/model/enums';
import { getConnectionsInOrder } from '~/selectors/ordered';

const severityLevels = ['error', 'warning', 'ok'];

const badgeColorForLevel = {
  ok: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
};

/**
 * Returns the severity class of the given connection based on its current
 * status.
 *
 * @param {Object} connection  the connection object
 * @return {string} the severity level of the connection
 */
function getSeverity(connection) {
  switch (connection.state) {
    case ConnectionState.CONNECTED:
      return 'ok';

    case ConnectionState.CONNECTING:
    case ConnectionState.DISCONNECTING:
      return 'warning';

    default:
      return 'error';
  }
}

/**
 * Selector that finds the "most severe" connection status among all the
 * connections and then counts how many connections have this status.
 *
 * Severity classes are as follows: ConnectionState.DISCONNECTED is the
 * most severe one (error level); ConnectionState.DISCONNECTING and
 * ConnectionState.CONNECTING are somewhat less severe (warning level);
 * ConnectionState.CONNECTED is totally normal. Any other connection state
 * is also considered as an error.
 *
 * @return {object} a pair consisting of a key named `level` whose value
 *   is one of `error`, `warning` or `ok`, and a key named `count` whose value
 *   shows how many connections are there with the given level
 */
const calculateStatusSummary = createSelector(
  getConnectionsInOrder,
  (connections) => {
    const severityCounts = countBy(connections, getSeverity);

    for (const level of severityLevels) {
      if (severityCounts[level]) {
        return { level, count: severityCounts[level] };
      }
    }

    return {
      level: 'ok',
      count: connections.length,
    };
  }
);

/**
 * @Smart badge component that colors and shows itself according to the
 * status of all the connections reported by the server.
 */
export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const { count, level } = calculateStatusSummary(state);
    return {
      color: badgeColorForLevel[level],
      visible: ownProps.isAlwaysVisible ? count > 0 : level !== 'ok',
    };
  },
  // Return empty object from mapDispatchToProps to avoid invalid prop warning
  // caused by react-badger not handling the automatically added dispatch prop.
  {}
)(SidebarBadge);
