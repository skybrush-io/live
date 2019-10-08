/**
 * @file Smart badge component that shows itself if there are unread
 * log messages with a given minimum severity level.
 */

import { connect } from 'react-redux';

import { colorForLogLevel, LogLevel } from '../../utils/logging';
import SidebarBadge from './SidebarBadge';

/**
 * Smart badge component that colors and shows itself according to the
 * status of all the connections reported by the server.
 */
export default connect(
  // MapStateToProps
  (state, ownProps) => {
    const level = state.log.highestUnseenMessageLevel;
    return {
      color: colorForLogLevel(level),
      visible: level >= (ownProps.level || LogLevel.WARNING)
    };
  },
  // Return empty object from mapDispatchToProps to avoid invalid prop warning
  // caused by react-badger not handling the automatically added dispatch prop.
  () => ({})
)(SidebarBadge);
