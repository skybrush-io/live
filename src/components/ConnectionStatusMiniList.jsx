import partial from 'lodash-es/partial';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import BackgroundHint from '~/components/BackgroundHint';
import { listOf } from '~/components/helpers/lists';
import { MiniList, MiniListItem } from '~/components/mini-list';
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

const ConnectionStatusMiniList = listOf(ConnectionStatusMiniListEntry, {
  dataProvider: 'connections',
  backgroundHint: (
    <BackgroundHint text='This server does not use any connections' />
  ),
  listFactory: partial(React.createElement, MiniList),
});

export default connect(
  (state) => ({
    connections: getConnectionsInOrder(state),
  }),
  {}
)(ConnectionStatusMiniList);
