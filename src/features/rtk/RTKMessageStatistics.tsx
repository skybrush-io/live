import Box from '@mui/material/Box';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { colorForStatus, Status } from '@skybrush/app-theme-mui';
import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { listOf } from '~/components/helpers/lists';
import type { RootState } from '~/store/reducers';
import { shortTimeAgoFormatter } from '~/utils/formatting';

import { getDisplayedListOfMessages } from './selectors';
import { describeMessageType } from './utils';

/* ************************************************************************ */

type RTKMessageStatisticsListEntryProps = {
  readonly bitsPerSecondReceived: number;
  readonly bitsPerSecondTransferred: number | undefined;
  readonly id: string;
  readonly lastUpdatedAt: number;
};

const RTKMessageStatisticsListEntry = ({
  bitsPerSecondReceived,
  bitsPerSecondTransferred,
  id,
  lastUpdatedAt,
}: RTKMessageStatisticsListEntryProps): JSX.Element => {
  const txKnown = bitsPerSecondTransferred !== undefined;
  const hasTx = (bitsPerSecondTransferred ?? 0) > 0;
  const hasRx = bitsPerSecondReceived > 0;
  const bps = hasTx ? bitsPerSecondTransferred! : bitsPerSecondReceived;
  return (
    <Box key={id} sx={{ display: 'flex' }}>
      <Box sx={{ width: 80, color: 'text.secondary' }}>{id}</Box>
      <Box sx={{ flex: 1 }}>{describeMessageType(id)}</Box>
      <Box
        sx={{ width: 112, ml: 1, color: 'text.secondary', textAlign: 'right' }}
      >
        {`${bps.toFixed(1)} bps `}
        <span
          style={{ color: colorForStatus(hasRx ? Status.INFO : Status.OFF) }}
        >
          {'\u2193'}
        </span>
        {txKnown && (
          <span
            style={{
              color: colorForStatus(hasTx ? Status.SUCCESS : Status.OFF),
            }}
          >
            {'\u2191'}
          </span>
        )}
      </Box>
      <Box sx={{ color: 'text.secondary', width: 32, textAlign: 'right' }}>
        <TimeAgo formatter={shortTimeAgoFormatter} date={lastUpdatedAt} />
      </Box>
    </Box>
  );
};

const RTKMessageStatistics = listOf(RTKMessageStatisticsListEntry, {
  dataProvider: 'items',
  backgroundHint: (
    <Translation>
      {(t) => (
        <BackgroundHint
          // TODO(vp): fix type coercion.
          text={t('RTKMessage.noRTKMessagesYet') as string | undefined}
        />
      )}
    </Translation>
  ),
});

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    dense: true,
    disablePadding: true,
    items: getDisplayedListOfMessages(state),
  }),
  // mapDispatchToProps
  {}
)(RTKMessageStatistics);
