import SettingsEthernet from '@material-ui/icons/SettingsEthernet';

import React from 'react';
import { connect } from 'react-redux';

import ConnectionStatusBadge from '../badges/ConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import ConnectionStatusMiniList from '~/components/ConnectionStatusMiniList';
import Tooltip from '~/components/Tooltip';
import { isConnected } from '~/selectors/servers';

const ConnectionStatusButtonPresentation = props => (
  <Tooltip content={<ConnectionStatusMiniList />} enabled={!props.isDisabled}>
    <GenericHeaderButton {...props}>
      <ConnectionStatusBadge />
      <SettingsEthernet />
    </GenericHeaderButton>
  </Tooltip>
);

ConnectionStatusButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes
};

export default connect(
  // mapStateToProps
  state => ({
    isDisabled: !isConnected(state)
  }),
  // mapDispatchToProps
  () => ({
    onClick() {}
  })
)(ConnectionStatusButtonPresentation);
