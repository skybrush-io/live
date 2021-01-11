import partial from 'lodash-es/partial';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import {
  MiniList,
  MiniListDivider,
  MiniListItem,
} from '~/components/mini-list';
import { togglePreferredChannel } from '~/features/mission/slice';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { getConnectionsInOrder } from '~/selectors/ordered';
import { shortTimeAgoFormatter } from '~/utils/formatting';

const ConnectionStatusMiniListEntry = ({ id, name, state, stateChangedAt }) => (
  <MiniListItem
    key={id}
    iconPreset={state}
    primaryText={name}
    secondaryText={
      <TimeAgo formatter={shortTimeAgoFormatter} date={stateChangedAt} />
    }
  />
);

ConnectionStatusMiniListEntry.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  state: PropTypes.string,
  stateChangedAt: PropTypes.number,
};

const ConnectionStatusMiniListAndButtons = ({
  connections,
  onSwitchSecondaryChannel,
  useSecondaryChannel,
}) => (
  <MiniList>
    {connections.map((item) => (
      <ConnectionStatusMiniListEntry key={item.id} {...item} />
    ))}
    <MiniListDivider />
    <FormControlLabel
      control={
        <Box pl={1}>
          <Switch size='small' />
        </Box>
      }
      label={<Typography variant='body2'>Use secondary channel</Typography>}
      checked={useSecondaryChannel}
      onChange={onSwitchSecondaryChannel}
    />
  </MiniList>
);

ConnectionStatusMiniListAndButtons.propTypes = {
  connections: PropTypes.arrayOf(PropTypes.any),
  onSwitchSecondaryChannel: PropTypes.func,
  useSecondaryChannel: PropTypes.bool,
};

export default connect(
  (state) => ({
    connections: getConnectionsInOrder(state),
    useSecondaryChannel: getPreferredCommunicationChannelIndex(state) !== 0,
  }),
  {
    onSwitchSecondaryChannel: () => togglePreferredChannel(),
  }
)(ConnectionStatusMiniListAndButtons);
