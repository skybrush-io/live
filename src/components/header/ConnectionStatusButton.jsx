import SettingsEthernet from '@material-ui/icons/SettingsEthernet';

import React from 'react';
import { connect } from 'react-redux';

import ConnectionStatusBadge from '../badges/ConnectionStatusBadge';
import GenericHeaderButton from './GenericHeaderButton';

import ConnectionStatusMiniList from '~/components/ConnectionStatusMiniList';
import LazyTooltip from '~/components/LazyTooltip';
import { isConnected } from '~/features/servers/selectors';

const ConnectionStatusButtonPresentation = (props) => (
  <LazyTooltip
    content={<ConnectionStatusMiniList />}
    disabled={props.isDisabled}
  >
    <GenericHeaderButton {...props}>
      <ConnectionStatusBadge />
      <SettingsEthernet />
    </GenericHeaderButton>
  </LazyTooltip>
);

ConnectionStatusButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isDisabled: !isConnected(state),
  }),
  // mapDispatchToProps
  () => ({
    onClick() {},
  })
)(ConnectionStatusButtonPresentation);
