import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListDivider from '@skybrush/mui-components/lib/MiniListDivider';
import MiniListItem from '@skybrush/mui-components/lib/MiniListItem';

import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { togglePreferredChannel } from '~/features/mission/slice';
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
  t,
  useSecondaryChannel,
}) => (
  <MiniList>
    {connections.map((item) => (
      <ConnectionStatusMiniListEntry key={item.id} {...item} />
    ))}
    {connections.length === 0 && (
      <MiniListItem primaryText={t('ConnectionStatusMiniList.noConnections')} />
    )}
    <MiniListDivider />
    <FormControlLabel
      control={
        <Box sx={{ pl: 1 }}>
          <Switch
            size='small'
            checked={useSecondaryChannel}
            onChange={onSwitchSecondaryChannel}
          />
        </Box>
      }
      label={
        <Typography variant='body2'>
          {t('ConnectionStatusMiniList.useSecondaryChannel')}
        </Typography>
      }
    />
  </MiniList>
);

ConnectionStatusMiniListAndButtons.propTypes = {
  connections: PropTypes.arrayOf(PropTypes.any),
  onSwitchSecondaryChannel: PropTypes.func,
  t: PropTypes.func,
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
)(withTranslation()(ConnectionStatusMiniListAndButtons));
