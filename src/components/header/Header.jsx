import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Shapeshifter from 'react-shapeshifter';
import TimeAgo from 'react-timeago';

import Box from '@material-ui/core/Box';

import AlertButton from './AlertButton';
import AppSettingsButton from './AppSettingsButton';
import AuthenticationButton from './AuthenticationButton';
import BroadcastButton from './BroadcastButton';
import ConnectionStatusButton from './ConnectionStatusButton';
import FullScreenButton from './FullScreenButton';
import GeofenceSettingsButton from './GeofenceSettingsButton';
import HelpButton from './HelpButton';
import ServerConnectionSettingsButton from './ServerConnectionSettingsButton';
import ToolboxButton from './ToolboxButton';

import UAVStatusSummary from '~/components/uavs/UAVStatusSummary';
import PerspectiveBar from '~/features/perspectives/PerspectiveBar';
import RTKStatusHeaderButton from '~/features/rtk/RTKStatusHeaderButton';
import { BROADCAST_MODE_TIMEOUT_LENGTH } from '~/features/settings/constants';
import { toggleSidebar } from '~/features/sidebar/actions';
import { isSidebarOpen } from '~/features/sidebar/selectors';
import AltitudeSummaryHeaderButton from '~/features/uavs/AltitudeSummaryHeaderButton';
import BatteryStatusHeaderButton from '~/features/uavs/BatteryStatusHeaderButton';
import WeatherHeaderButton from '~/features/weather/WeatherHeaderButton';
import { shouldSidebarBeShown } from '~/features/workbench/selectors';
import { hasFeature } from '~/utils/configuration';

const style = {
  backgroundColor: '#333',
  flexGrow: 0,
  minHeight: 48,
};

const innerStyle = {
  display: 'flex',
  flexFlow: 'row nowrap',
};

const headingFormatter = (value, unit, suffix) =>
  suffix === 'ago' ? 'Session expired' : 'Session expires';

const SessionExpiryBox = ({ expiresAt }) => {
  return (
    <Box
      alignSelf='center'
      px={1}
      style={{ color: 'white', fontSize: '0.875rem', textAlign: 'right' }}
    >
      <div style={{ color: 'rgba(255, 255, 255, 0.54)' }}>
        <TimeAgo date={expiresAt} formatter={headingFormatter} />
      </div>
      <div>
        <b>
          <TimeAgo date={expiresAt} />
        </b>
      </div>
    </Box>
  );
};

SessionExpiryBox.propTypes = {
  expiresAt: PropTypes.number,
};

/**
 * Presentation component for the header at the top edge of the main
 * window.
 *
 * @returns  {Object}  the rendered header component
 */
const Header = ({
  isSidebarOpen,
  sessionExpiresAt,
  showSidebar,
  toggleSidebar,
}) => (
  <div id='header' style={{ ...style, overflow: 'hidden' }}>
    <div id='header-inner' style={innerStyle}>
      {showSidebar && (
        <Shapeshifter
          color='#999'
          style={{ cursor: 'pointer' }}
          shape={isSidebarOpen ? 'close' : 'menu'}
          onClick={toggleSidebar}
        />
      )}

      <PerspectiveBar />
      <Box pr={0.5} />
      <UAVStatusSummary />
      <hr />
      <AltitudeSummaryHeaderButton />
      <BatteryStatusHeaderButton />
      {hasFeature('toolboxMenu') && <RTKStatusHeaderButton />}
      <hr />
      <WeatherHeaderButton />
      <hr />
      <ConnectionStatusButton />
      <hr />
      <ServerConnectionSettingsButton />
      {hasFeature('geofence') && <GeofenceSettingsButton />}
      <AuthenticationButton />
      <hr />
      <BroadcastButton timeoutLength={BROADCAST_MODE_TIMEOUT_LENGTH} />
      {hasFeature('toolboxMenu') && <ToolboxButton />}
      <AppSettingsButton />
      <AlertButton />
      {config.urls.help ? <HelpButton /> : null}
      {window.bridge && window.bridge.isElectron ? null : <FullScreenButton />}
      {sessionExpiresAt && (
        <>
          <SessionExpiryBox expiresAt={sessionExpiresAt} />
          <hr />
        </>
      )}
    </div>
  </div>
);

Header.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  sessionExpiresAt: PropTypes.number,
  showSidebar: PropTypes.bool,
  toggleSidebar: PropTypes.func.isRequired,
};

export default connect(
  // mapStateToProps
  (state) => ({
    sessionExpiresAt: state.session.expiresAt,
    isSidebarOpen: isSidebarOpen(state),
    showSidebar: shouldSidebarBeShown(state),
  }),
  // mapDispatchToProps
  { toggleSidebar }
)(Header);
