/**
 * @file Smart badge component that shows whether a geofence is active and in
 * case it is, then also whether it has been manually or automatically created.
 */

import { connect } from 'react-redux';

import SidebarBadge from './SidebarBadge';

import { colorForStatus } from '~/components/colors';

import { getGeofenceStatus } from '~/features/mission/selectors';

/**
 * Smart badge component that shows whether a geofence is active and in case it
 * is, then also whether it has been manually or automatically created.
 */
export default connect(
  // mapStateToProps
  (state) => ({
    color: colorForStatus(getGeofenceStatus(state)),
    visible: true,
  }),
  // Return empty object from mapDispatchToProps to avoid invalid prop warning
  // caused by react-badger not handling the automatically added dispatch prop.
  () => ({})
)(SidebarBadge);
