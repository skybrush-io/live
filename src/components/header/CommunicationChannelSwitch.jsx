import LooksTwo from '@mui/icons-material/LooksTwo';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { GenericHeaderButton, SidebarBadge } from '@skybrush/mui-components';

import Colors from '~/components/colors';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { togglePreferredChannel } from '~/features/mission/slice';

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
