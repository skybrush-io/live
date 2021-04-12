import React from 'react';
import { connect } from 'react-redux';

import SettingsEthernet from '@material-ui/icons/SettingsEthernet';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import LazyTooltip from '@skybrush/mui-components/lib/LazyTooltip';

import ConnectionStatusMiniList from '~/components/ConnectionStatusMiniList';
import ConnectionStatusBadge from '~/components/badges/ConnectionStatusBadge';
import { isConnected } from '~/features/servers/selectors';

const ConnectionStatusButtonPresentation = (props) => (
  <LazyTooltip
    interactive
    content={<ConnectionStatusMiniList />}
    disabled={props.disabled}
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
    disabled: !isConnected(state),
  }),
  // mapDispatchToProps
  () => ({
    onClick() {},
  })
)(ConnectionStatusButtonPresentation);
