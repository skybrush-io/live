import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { useTheme } from '@material-ui/core/styles';
import LooksTwo from '@material-ui/icons/LooksTwo';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import { togglePreferredChannel } from '~/features/mission/slice';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';

const CommunicationChannelSwitch = ({ selected, ...rest }) => {
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

CommunicationChannelSwitch.propTypes = {
  onClick: PropTypes.func,
  selected: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selected: getPreferredCommunicationChannelIndex(state) !== 0,
  }),
  // mapDispatchToProps
  {
    onClick: togglePreferredChannel,
  }
)(CommunicationChannelSwitch);
