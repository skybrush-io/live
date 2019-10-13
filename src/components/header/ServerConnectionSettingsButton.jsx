import ConnectionIcon from '@material-ui/icons/Power';

import React from 'react';
import { connect } from 'react-redux';

import ServerConnectionStatusBadge from '../badges/ServerConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import { showServerSettingsDialog } from '~/actions/server-settings';

const ServerConnectionSettingsButtonPresentation = props => (
  <GenericHeaderButton {...props}>
    <ServerConnectionStatusBadge />
    <ConnectionIcon />
  </GenericHeaderButton>
);

ServerConnectionSettingsButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes
};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  dispatch => ({
    onClick() {
      dispatch(showServerSettingsDialog());
    }
  })
)(ServerConnectionSettingsButtonPresentation);
