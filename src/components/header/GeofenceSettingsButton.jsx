import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import GeofenceStatusBadge from '~/components/badges/GeofenceStatusBadge';
import { showGeofenceSettingsDialog } from '~/features/geofence/slice';
import PlacesFence from '~/icons/PlacesFence';

const GeofenceSettingsButton = (props) => (
  <GenericHeaderButton {...props} tooltip='Geofence settings'>
    <GeofenceStatusBadge />
    <PlacesFence />
  </GenericHeaderButton>
);

GeofenceSettingsButton.propTypes = {
  onClick: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: showGeofenceSettingsDialog,
  }
)(GeofenceSettingsButton);
