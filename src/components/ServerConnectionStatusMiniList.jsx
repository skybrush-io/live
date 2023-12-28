import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

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
import { ConnectionState } from '~/model/enums';

const connectionStateToPrimaryText = {
  [ConnectionState.CONNECTED]: (t) => t('serverConnectionStatus.connected'),
  [ConnectionState.CONNECTING]: (t) => t('serverConnectionStatus.connecting'),
  [ConnectionState.DISCONNECTED]: (t) =>
    t('serverConnectionStatus.disconnected'),
  [ConnectionState.DISCONNECTING]: (t) =>
    t('serverConnectionStatus.disconnecting'),
};

const unknownConnectionStateToPrimaryText = (t) =>
  t('serverConnectionStatus.unknownState');

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
  t,
}) => (
  <MiniList>
    <MiniListItem
      iconPreset={connectionState}
      primaryText={(
        connectionStateToPrimaryText[connectionState] ||
        unknownConnectionStateToPrimaryText
      )(t)}
      secondaryText={
        connectionState === ConnectionState.CONNECTED ? serverHostname : null
      }
    />
    {connectionState === ConnectionState.CONNECTED ? (
      <>
        <MiniListItem
          iconPreset='empty'
          primaryText={t('serverConnectionStatus.version')}
          secondaryText={serverVersion}
        />
        <MiniListDivider />
        {clockSkew === 0 ? (
          <MiniListItem
            iconPreset='success'
            primaryText={t('serverConnectionStatus.clocksSync')}
          />
        ) : (
          <MiniListItem
            iconPreset={
              Math.abs(clockSkew) > roundTripTime / 2 ? 'warning' : 'empty'
            }
            primaryText={t('serverConnectionStatus.clockSkew')}
            secondaryText={formatDurationInMsec(clockSkew)}
          />
        )}
        <MiniListItem
          iconPreset={roundTripTime > MAX_ROUNDTRIP_TIME ? 'warning' : 'empty'}
          primaryText={t('serverConnectionStatus.roundTripTime')}
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
  t: PropTypes.func,
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
)(withTranslation()(ServerConnectionStatusMiniList));
