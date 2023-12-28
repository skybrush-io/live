import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ConnectionIcon from '@material-ui/icons/Power';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import LazyTooltip from '@skybrush/mui-components/lib/LazyTooltip';

import ServerConnectionStatusMiniList from '~/components/ServerConnectionStatusMiniList';
import ServerConnectionStatusBadge from '~/components/badges/ServerConnectionStatusBadge';
import { showServerSettingsDialog } from '~/features/servers/actions';

const ServerConnectionSettingsButton = ({ hideTooltip, ...rest }) => {
  const body = (
    <GenericHeaderButton {...rest}>
      <ServerConnectionStatusBadge />
      <ConnectionIcon />
    </GenericHeaderButton>
  );

  return hideTooltip ? (
    body
  ) : (
    <LazyTooltip content={<ServerConnectionStatusMiniList />}>
      {body}
    </LazyTooltip>
  );
};

ServerConnectionSettingsButton.propTypes = {
  hideTooltip: PropTypes.bool,
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
