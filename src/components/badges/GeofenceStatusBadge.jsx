/**
 * @file Smart badge component that shows whether a geofence is active and in
 * case it is, then also whether it has been manually or automatically created.
 */

import { connect } from 'react-redux';

import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import { colorForStatus } from '~/components/colors';
import { Status } from '~/components/semantics';
import { getGeofenceStatus } from '~/features/mission/selectors';

/**
 * Smart badge component that shows whether a geofence is active and in case it
 * is, then also whether it has been manually or automatically created.
 */
export default connect(
  // mapStateToProps
  (state) => {
    const status = getGeofenceStatus(state);
    return {
      color: colorForStatus(status),
      visible: status !== Status.OFF,
    };
  },
  // Return empty object from mapDispatchToProps to avoid invalid prop warning
  // caused by react-badger not handling the automatically added dispatch prop.
  {}
)(SidebarBadge);
