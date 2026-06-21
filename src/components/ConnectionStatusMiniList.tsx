import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { createSelector } from '@reduxjs/toolkit';
import type { TFunction } from 'i18next';
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
import { ConnectionState } from '~/model/enums';
import { getConnectionsInOrder } from '~/selectors/ordered';
import type { RootState } from '~/store/reducers';
import { shortTimeAgoFormatter } from '~/utils/formatting';

type ConnectionPropertiesOrSummary = ConnectionProperties & {
  summaryCount?: number;
};

type ConnectionStatusMiniListEntryProps = ConnectionPropertiesOrSummary & {
  t: TFunction;
};

// Additional translation keys generated at runtime:
//
// t('ConnectionStatusMiniList.summaryItem.connected')
// t('ConnectionStatusMiniList.summaryItem.connecting')
// t('ConnectionStatusMiniList.summaryItem.disconnecting')
// t('ConnectionStatusMiniList.summaryItem.disconnected')

const ConnectionStatusMiniListEntry = ({
  id,
  name,
  summaryCount,
  state,
  stateChangedAt,
  t,
}: ConnectionStatusMiniListEntryProps) => (
  <MiniListItem
    key={id}
    iconPreset={state}
    primaryText={
      summaryCount && summaryCount > 0
        ? t(`ConnectionStatusMiniList.summaryItem.${state}`, {
            count: summaryCount,
          })
        : name
    }
    secondaryText={
      stateChangedAt ? (
        <TimeAgo formatter={shortTimeAgoFormatter} date={stateChangedAt} />
      ) : undefined
    }
  />
);

/**
 * Selector that returns the list of connections to be shown in the mini list, in the
 * order they should be shown, limited to a certain number of entries if necessary.
 *
 * When limiting the number of entries, connections that are in a "connected" state
 * are collapsed into a single entry until the limit is no longer exceeded. If
 * collapsing all "connected" connections is not sufficient to get under the limit,
 * the remaining connections in "connecting" or "disconnecting" states are also
 * collapsed. Finally, all remaining connections are collapsed if necessary.
 *
 * @param state
 */
const getConnectionsWithLimit = createSelector(
  getConnectionsInOrder,
  (state: RootState, limit: number | null | undefined) => limit,
  (
    connections: ConnectionProperties[],
    limit: number | null | undefined
  ): ConnectionPropertiesOrSummary[] => {
    if (typeof limit !== 'number' || connections.length <= limit) {
      return connections;
    }

    // Too many connections. Collapse by state until we get under the limit.
    let result: ConnectionPropertiesOrSummary[] = [...connections];
    let excessCount = result.length - limit;
    const statesToCollapse: ConnectionState[] = [
      ConnectionState.CONNECTED,
      ConnectionState.CONNECTING,
      ConnectionState.DISCONNECTING,
      ConnectionState.DISCONNECTED,
    ];

    for (const stateToCollapse of statesToCollapse) {
      if (excessCount <= 0) {
        break;
      }

      const filtered: ConnectionPropertiesOrSummary[] = [];
      const remains: ConnectionPropertiesOrSummary[] = [];

      // We are iterating over the result in reverse order because we want to filter
      // the items from the end.
      for (const connection of result.reverse()) {
        if (connection.state === stateToCollapse) {
          // This connection can be removed.
          if (excessCount >= 0) {
            // We still need to remove some items. Note that we need to remove some
            // items even if excessCount is 0 because we need one more slot where we
            // can put the summary of the collapsed items.
            filtered.push(connection);
            excessCount--;
            continue;
          }
        }

        // This connection is not in the state we are collapsing, keep it.
        remains.push(connection);
      }

      // remains was now filled in reverse order so reverse it again.
      remains.reverse();

      // If we have at least two items that we would have filtered, add a summary
      // instead and increase excessCount by 1 because of the summary. If we have only
      // one item that we could filter, there is no point in replacing it with a
      // summary, so we just keep it in the list.
      if (filtered.length > 1) {
        remains.push({
          id: `collapsed-${stateToCollapse}`,
          name: '',
          state: stateToCollapse,
          summaryCount: filtered.length,
        });
        excessCount++;
      } else if (filtered.length === 1) {
        remains.push(filtered[0]);
        excessCount++;
      }

      result = remains;
    }

    return result;
  }
);

type ConnectionStatusMiniListAndButtonsProps = {
  connections: ConnectionPropertiesOrSummary[];
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
        <ConnectionStatusMiniListEntry key={item.id} {...item} t={t} />
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
  (state: RootState, { limit }: { limit?: number }) => ({
    connections: getConnectionsWithLimit(state, limit),
    useSecondaryChannel: getPreferredCommunicationChannelIndex(state) !== 0,
  }),
  {
    onSwitchSecondaryChannel: () => togglePreferredChannel(),
  }
)(ConnectionStatusMiniListAndButtons);
