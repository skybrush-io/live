import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import GeofenceStatusBadge from '~/components/badges/GeofenceStatusBadge';
import { showGeofenceSettingsDialog } from '~/features/geofence/slice';
import PlacesFence from '~/icons/PlacesFence';

const GeofenceSettingsButton = (props) => (
  <Translation>
    {(t) => (
      <GenericHeaderButton {...props} tooltip={t('geofenceDialog.title')}>
        <GeofenceStatusBadge />
        <PlacesFence />
      </GenericHeaderButton>
    )}
  </Translation>
);

GeofenceSettingsButton.propTypes = {
  onClick: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: showGeofenceSettingsDialog,
  }
)(GeofenceSettingsButton);
