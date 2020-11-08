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
  getRoundedClockSkewInMilliseconds,
  getRoundTripTimeInMilliseconds,
  getServerHostname,
} from '~/features/servers/selectors';
import { ConnectionState } from '~/model/connections';

const connectionStateToPrimaryText = {
  [ConnectionState.CONNECTED]: 'Connected',
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
  serverName,
}) => (
  <MiniList>
    <MiniListItem
      iconPreset={connectionState}
      primaryText={
        connectionStateToPrimaryText[connectionState] || 'Unknown state'
      }
      secondaryText={
        connectionState === ConnectionState.CONNECTED ? serverName : null
      }
    />
    {connectionState === ConnectionState.CONNECTED ? (
      <>
        <MiniListDivider />
        {clockSkew === 0 ? (
          <MiniListItem
            iconPreset='success'
            primaryText='Clocks synchronized'
          />
        ) : (
          <MiniListItem
            iconPreset={
              Math.abs(clockSkew) > roundTripTime / 2 ? 'warning' : 'empty'
            }
            primaryText='Clock skew'
            secondaryText={formatDurationInMsec(clockSkew)}
          />
        )}
        <MiniListItem
          iconPreset={roundTripTime > MAX_ROUNDTRIP_TIME ? 'warning' : 'empty'}
          primaryText='Round-trip time'
          secondaryText={formatDurationInMsec(roundTripTime)}
        />
      </>
    ) : null}
  </MiniList>
);

ServerConnectionStatusMiniList.propTypes = {
  clockSkew: PropTypes.number,
  connectionState: PropTypes.string,
  roundTripTime: PropTypes.number,
  serverName: PropTypes.string,
};

export default connect(
  (state) => ({
    connectionState: getCurrentServerState(state).state,
    clockSkew: getRoundedClockSkewInMilliseconds(state),
    roundTripTime: getRoundTripTimeInMilliseconds(state),
    serverName: getServerHostname(state),
  }),
  {}
)(ServerConnectionStatusMiniList);
