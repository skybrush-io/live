import ConnectionIcon from '@material-ui/icons/Power';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ServerConnectionStatusBadge from '../badges/ServerConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import { showServerSettingsDialog } from '~/actions/server-settings';

const ServerConnectionSettingsButton = (props) => (
  <GenericHeaderButton {...props} tooltip='Server connection status'>
    <ServerConnectionStatusBadge />
    <ConnectionIcon />
  </GenericHeaderButton>
);

ServerConnectionSettingsButton.propTypes = {
  onClick: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: showServerSettingsDialog,
  }
)(ServerConnectionSettingsButton);
