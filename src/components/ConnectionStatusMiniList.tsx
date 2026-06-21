import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import {
  MiniList,
  MiniListDivider,
  MiniListItem,
} from '@skybrush/mui-components';

import type { ConnectionProperties } from '~/features/connections/types';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { togglePreferredChannel } from '~/features/mission/slice';
import { getConnectionsInOrder } from '~/selectors/ordered';
import type { RootState } from '~/store/reducers';
import { shortTimeAgoFormatter } from '~/utils/formatting';

type ConnectionStatusMiniListEntryProps = {
  id: string;
  name: string;
  state: string;
  stateChangedAt?: number;
};

const ConnectionStatusMiniListEntry = ({
  id,
  name,
  state,
  stateChangedAt,
}: ConnectionStatusMiniListEntryProps) => (
  <MiniListItem
    key={id}
    iconPreset={state}
    primaryText={name}
    secondaryText={
      stateChangedAt ? (
        <TimeAgo formatter={shortTimeAgoFormatter} date={stateChangedAt} />
      ) : undefined
    }
  />
);

type ConnectionStatusMiniListAndButtonsProps = {
  connections: ConnectionProperties[];
  onSwitchSecondaryChannel: () => void;
  useSecondaryChannel: boolean;
};

const ConnectionStatusMiniListAndButtons = ({
  connections,
  onSwitchSecondaryChannel,
  useSecondaryChannel,
}: ConnectionStatusMiniListAndButtonsProps) => {
  const { t } = useTranslation();

  return (
    <MiniList>
      {connections.map((item) => (
        <ConnectionStatusMiniListEntry key={item.id} {...item} />
      ))}
      {connections.length === 0 && (
        <MiniListItem
          primaryText={t('ConnectionStatusMiniList.noConnections')}
        />
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
};

export default connect(
  (state: RootState) => ({
    connections: getConnectionsInOrder(state),
    useSecondaryChannel: getPreferredCommunicationChannelIndex(state) !== 0,
  }),
  {
    onSwitchSecondaryChannel: () => togglePreferredChannel(),
  }
)(ConnectionStatusMiniListAndButtons);
