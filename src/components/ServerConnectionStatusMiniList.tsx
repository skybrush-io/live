import isNil from 'lodash-es/isNil';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  MiniList,
  MiniListDivider,
  MiniListItem,
} from '@skybrush/mui-components';

import { MAX_ROUNDTRIP_TIME } from '~/features/servers/constants';
import {
  getCurrentServerState,
  getRoundedClockSkewInMilliseconds,
  getRoundTripTimeInMilliseconds,
  getServerHostname,
  getServerVersion,
} from '~/features/servers/selectors';
import { tt } from '~/i18n';
import { ConnectionState } from '~/model/enums';
import type { RootState } from '~/store/reducers';

const connectionStateToPrimaryText = {
  [ConnectionState.CONNECTED]: tt('serverConnectionStatus.connected'),
  [ConnectionState.CONNECTING]: tt('serverConnectionStatus.connecting'),
  [ConnectionState.DISCONNECTED]: tt('serverConnectionStatus.disconnected'),
  [ConnectionState.DISCONNECTING]: tt('serverConnectionStatus.disconnecting'),
};

const unknownConnectionStateToPrimaryText = tt(
  'serverConnectionStatus.unknownState'
);

const formatDurationInMsec = (duration: number | undefined): string => {
  if (isNil(duration)) {
    return 'unknown';
  }

  if (!Number.isFinite(duration)) {
    return duration < 0 ? '-∞' : '∞';
  }

  if (Math.abs(duration) < 1000) {
    return `${duration.toFixed(0)}ms`;
  }

  if (Math.abs(duration) <= 30000) {
    return `${(duration / 1000).toFixed(1)}s`;
  }

  return '>30s';
};

type Props = {
  clockSkew?: number;
  connectionState: ConnectionState;
  roundTripTime?: number;
  serverHostname?: string;
  serverVersion?: string;
};

const ServerConnectionStatusMiniList = ({
  clockSkew,
  connectionState,
  roundTripTime,
  serverHostname,
  serverVersion,
}: Props) => {
  const { t } = useTranslation();

  return (
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
                typeof clockSkew === 'number' &&
                typeof roundTripTime === 'number' &&
                Math.abs(clockSkew) > roundTripTime / 2
                  ? 'warning'
                  : 'empty'
              }
              primaryText={t('serverConnectionStatus.clockSkew')}
              secondaryText={formatDurationInMsec(clockSkew)}
            />
          )}
          <MiniListItem
            iconPreset={
              typeof roundTripTime === 'number' &&
              roundTripTime > MAX_ROUNDTRIP_TIME
                ? 'warning'
                : 'empty'
            }
            primaryText={t('serverConnectionStatus.roundTripTime')}
            secondaryText={formatDurationInMsec(roundTripTime)}
          />
        </>
      ) : null}
    </MiniList>
  );
};

export default connect(
  (state: RootState) => ({
    connectionState: getCurrentServerState(state).state,
    clockSkew: getRoundedClockSkewInMilliseconds(state),
    roundTripTime: getRoundTripTimeInMilliseconds(state),
    serverHostname: getServerHostname(state),
    serverVersion: getServerVersion(state),
  }),
  {}
)(ServerConnectionStatusMiniList);
