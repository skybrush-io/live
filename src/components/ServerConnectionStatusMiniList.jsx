import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  MiniList,
  MiniListDivider,
  MiniListItem,
} from '~/components/mini-list';
import { MAX_ROUNDTRIP_TIME } from '~/features/servers/constants';
import {
  getCurrentServerState,
  getClockSkewInMilliseconds,
  getRoundTripTimeInMilliseconds,
} from '~/features/servers/selectors';
import { ConnectionState } from '~/model/connections';

const connectionStateToPrimaryText = {
  [ConnectionState.CONNECTED]: 'Connected to server',
  [ConnectionState.CONNECTING]: 'Connection in progress...',
  [ConnectionState.DISCONNECTED]: 'Disconnected from server',
  [ConnectionState.DISCONNECTING]: 'Disconnection in progress...',
};

const formatDurationInMsec = (number) => {
  if (isNil(number)) {
    return 'unknown';
  }

  if (!Number.isFinite(number)) {
    return number < 0 ? '-\u221E' : '\u221E';
  }

  if (Math.abs(number) < 1000) {
    return `${number.toFixed(0)}ms`;
  }

  if (Math.abs(number) <= 30000) {
    return `${(number / 1000).toFixed(1)}s`;
  }

  return '>30s';
};

const ServerConnectionStatusMiniList = ({
  clockSkew,
  connectionState,
  roundTripTime,
}) => {
  return (
    <MiniList>
      <MiniListItem
        iconPreset={connectionState}
        primaryText={
          connectionStateToPrimaryText[connectionState] || 'Unknown state'
        }
      />
      <MiniListDivider />
      {!isNil(clockSkew) &&
      !isNil(roundTripTime) &&
      roundTripTime <= MAX_ROUNDTRIP_TIME &&
      clockSkew <= roundTripTime / 2 ? (
        <MiniListItem iconPreset='success' primaryText='Clocks synchronized' />
      ) : (
        <MiniListItem
          iconPreset={clockSkew > roundTripTime / 2 ? 'warning' : 'empty'}
          primaryText='Clock skew'
          secondaryText={formatDurationInMsec(clockSkew)}
        />
      )}
      <MiniListItem
        iconPreset={roundTripTime > MAX_ROUNDTRIP_TIME ? 'warning' : 'empty'}
        primaryText='Round-trip time'
        secondaryText={formatDurationInMsec(roundTripTime)}
      />
    </MiniList>
  );
};

ServerConnectionStatusMiniList.propTypes = {
  clockSkew: PropTypes.number,
  connectionState: PropTypes.string,
  roundTripTime: PropTypes.number,
};

export default connect(
  (state) => ({
    connectionState: getCurrentServerState(state).state,
    clockSkew: getClockSkewInMilliseconds(state),
    roundTripTime: getRoundTripTimeInMilliseconds(state),
  }),
  {}
)(ServerConnectionStatusMiniList);
