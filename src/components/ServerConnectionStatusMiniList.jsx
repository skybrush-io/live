import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListDivider from '@skybrush/mui-components/lib/MiniListDivider';
import MiniListItem from '@skybrush/mui-components/lib/MiniListItem';

import { MAX_ROUNDTRIP_TIME } from '~/features/servers/constants';
import {
  getCurrentServerState,
  getCurrentServerVersion,
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
    return number < 0 ? '-∞' : '∞';
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
  serverHostname,
  serverVersion,
}) => (
  <MiniList>
    <MiniListItem
      iconPreset={connectionState}
      primaryText={
        connectionStateToPrimaryText[connectionState] || 'Unknown state'
      }
      secondaryText={
        connectionState === ConnectionState.CONNECTED ? serverHostname : null
      }
    />
    {connectionState === ConnectionState.CONNECTED ? (
      <>
        <MiniListItem
          iconPreset='empty'
          primaryText='Server version'
          secondaryText={serverVersion}
        />
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
  serverHostname: PropTypes.string,
  serverVersion: PropTypes.string,
};

export default connect(
  (state) => ({
    connectionState: getCurrentServerState(state).state,
    clockSkew: getRoundedClockSkewInMilliseconds(state),
    roundTripTime: getRoundTripTimeInMilliseconds(state),
    serverHostname: getServerHostname(state),
    serverVersion: getCurrentServerVersion(state),
  }),
  {}
)(ServerConnectionStatusMiniList);
