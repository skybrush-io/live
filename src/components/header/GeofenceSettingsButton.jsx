import PlacesFence from '~/icons/PlacesFence';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import GeofenceStatusBadge from '../badges/GeofenceStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import { showGeofenceSettingsDialog } from '~/actions/geofence-settings';

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
