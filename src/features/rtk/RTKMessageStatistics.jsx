import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import Box from '@material-ui/core/Box';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { listOf } from '~/components/helpers/lists';
import { shortTimeAgoFormatter } from '~/utils/formatting';

import { getDisplayedListOfMessages } from './selectors';
import { describeMessageType } from './utils';

/* ************************************************************************ */

const RTKMessageStatisticsListEntry = ({
  bitsPerSecond,
  id,
  lastUpdatedAt,
}) => (
  <Box key={id} display='flex'>
    <Box width={80} color='text.secondary'>
      {id}
    </Box>
    <Box flex={1}>{describeMessageType(id)}</Box>
    <Box width={80} ml={1} color='text.secondary' textAlign='right'>
      {bitsPerSecond ? `${bitsPerSecond.toFixed(1)} bps` : ''}
    </Box>
    <Box color='text.secondary' width={32} textAlign='right'>
      <TimeAgo formatter={shortTimeAgoFormatter} date={lastUpdatedAt} />
    </Box>
  </Box>
);

RTKMessageStatisticsListEntry.propTypes = {
  bitsPerSecond: PropTypes.number,
  id: PropTypes.string,
  lastUpdatedAt: PropTypes.number,
};

const RTKMessageStatistics = listOf(RTKMessageStatisticsListEntry, {
  dataProvider: 'items',
  backgroundHint: (
    <Translation>
      {(t) => <BackgroundHint text={t('RTKMessage.noRTKMessagesYet')} />}
    </Translation>
  ),
});

export default connect(
  // mapStateToProps
  (state) => ({
    dense: true,
    disablePadding: true,
    items: getDisplayedListOfMessages(state),
  }),
  // mapDispatchToProps
  {}
)(RTKMessageStatistics);
