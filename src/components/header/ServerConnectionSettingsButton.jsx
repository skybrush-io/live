import ConnectionIcon from '@material-ui/icons/Power';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ServerConnectionStatusBadge from '../badges/ServerConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import { showServerSettingsDialog } from '~/actions/server-settings';
import ServerConnectionStatusMiniList from '~/components/ServerConnectionStatusMiniList';
import LazyTooltip from '~/components/LazyTooltip';

const ServerConnectionSettingsButton = (props) => (
  <LazyTooltip content={<ServerConnectionStatusMiniList />}>
    <GenericHeaderButton {...props}>
      <ServerConnectionStatusBadge />
      <ConnectionIcon />
    </GenericHeaderButton>
  </LazyTooltip>
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
