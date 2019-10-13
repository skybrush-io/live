import SettingsEthernet from '@material-ui/icons/SettingsEthernet';

import React from 'react';
import { connect } from 'react-redux';

import ConnectionStatusBadge from '../badges/ConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import { isConnected } from '~/selectors/servers';

const ConnectionStatusButtonPresentation = props => (
  <GenericHeaderButton {...props}>
    <ConnectionStatusBadge />
    <SettingsEthernet />
  </GenericHeaderButton>
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
