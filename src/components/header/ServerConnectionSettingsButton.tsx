import ConnectionIcon from '@mui/icons-material/Power';
import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  LazyTooltip,
  type GenericHeaderButtonProps,
} from '@skybrush/mui-components';

import ServerConnectionStatusMiniList from '~/components/ServerConnectionStatusMiniList';
import ServerConnectionStatusBadge from '~/components/badges/ServerConnectionStatusBadge';
import { showServerSettingsDialog } from '~/features/servers/actions';

type Props = {
  hideTooltip?: boolean;
} & GenericHeaderButtonProps;

const ServerConnectionSettingsButton = ({ hideTooltip, ...rest }: Props) => {
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

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: showServerSettingsDialog,
  }
)(ServerConnectionSettingsButton);
