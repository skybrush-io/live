import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ConnectionIcon from '@material-ui/icons/Power';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import LazyTooltip from '@skybrush/mui-components/lib/LazyTooltip';

import { showServerSettingsDialog } from '~/actions/server-settings';
import ServerConnectionStatusMiniList from '~/components/ServerConnectionStatusMiniList';
import ServerConnectionStatusBadge from '~/components/badges/ServerConnectionStatusBadge';

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
