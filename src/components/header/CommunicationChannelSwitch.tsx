import LooksTwo from '@mui/icons-material/LooksTwo';
import { useTheme } from '@mui/material/styles';
import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  type GenericHeaderButtonProps,
  SidebarBadge,
} from '@skybrush/mui-components';

import Colors from '~/components/colors';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { togglePreferredChannel } from '~/features/mission/slice';
import type { RootState } from '~/store/reducers';

type Props = {
  selected: boolean;
} & GenericHeaderButtonProps;

const CommunicationChannelSwitch = ({ selected, ...rest }: Props) => {
  const theme = useTheme();
  return (
    <GenericHeaderButton
      {...rest}
      tooltip={
        selected ? 'Switch to primary channel' : 'Switch to secondary channel'
      }
    >
      <SidebarBadge color={Colors.info} visible={selected} />
      <span
        style={{ opacity: selected ? 1 : theme.palette.action.disabledOpacity }}
      >
        <LooksTwo />
      </span>
    </GenericHeaderButton>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    selected: getPreferredCommunicationChannelIndex(state) !== 0,
  }),
  // mapDispatchToProps
  {
    onClick: () => togglePreferredChannel(),
  }
)(CommunicationChannelSwitch);
