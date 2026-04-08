import SettingsEthernet from '@mui/icons-material/SettingsEthernet';
import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  LazyTooltip,
  type GenericHeaderButtonProps,
} from '@skybrush/mui-components';

import ConnectionStatusMiniList from '~/components/ConnectionStatusMiniList';
import ConnectionStatusBadge from '~/components/badges/ConnectionStatusBadge';
import ChannelIndicator from '~/components/header/ChannelIndicator';
import { isConnected } from '~/features/servers/selectors';
import type { RootState } from '~/store/reducers';

type Props = GenericHeaderButtonProps;

const ConnectionStatusButtonPresentation = (props: Props) => (
  <LazyTooltip
    interactive
    content={<ConnectionStatusMiniList />}
    disabled={props.disabled}
  >
    <GenericHeaderButton {...props}>
      <ConnectionStatusBadge />
      <SettingsEthernet />
      <ChannelIndicator />
    </GenericHeaderButton>
  </LazyTooltip>
);

ConnectionStatusButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    disabled: !isConnected(state),
  }),
  // mapDispatchToProps
  {}
)(ConnectionStatusButtonPresentation);
