import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Security from '@material-ui/icons/Security';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import GeofenceStatusBadge from '~/components/badges/GeofenceStatusBadge';
import { openSafetyDialog } from '~/features/safety/slice';

const SafetyButton = (props) => (
  <GenericHeaderButton {...props} tooltip='Safety'>
    <GeofenceStatusBadge />
    <Security />
  </GenericHeaderButton>
);

SafetyButton.propTypes = {
  onClick: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: openSafetyDialog,
  }
)(SafetyButton);
