import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Shapeshifter from 'react-shapeshifter';
import TimeAgo from 'react-timeago';

import Box from '@material-ui/core/Box';

import AppSettingsButton from './AppSettingsButton';
import AuthenticationButton from './AuthenticationButton';
import ConnectionStatusButton from './ConnectionStatusButton';
import FullScreenButton from './FullScreenButton';
import GeofenceSettingsButton from './GeofenceSettingsButton';
import HelpButton from './HelpButton';
import ServerConnectionSettingsButton from './ServerConnectionSettingsButton';
import ToolboxButton from './ToolboxButton';

import UAVStatusSummary from '../uavs/UAVStatusSummary';

import RTKStatusHeaderButton from '~/features/rtk/RTKStatusHeaderButton';
import { toggleSidebar } from '~/features/sidebar/slice';
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

/**
 * Presentation component for the header at the top edge of the main
 * window.
 *
 * @returns  {Object}  the rendered header component
 */
const Header = ({ isSidebarOpen, sessionExpiresAt, toggleSidebar }) => (
  <div id='header' style={{ ...style, overflow: 'hidden' }}>
    <div id='header-inner' style={innerStyle}>
      <Shapeshifter
        color='#999'
        style={{ cursor: 'pointer' }}
        shape={isSidebarOpen ? 'close' : 'menu'}
        onClick={toggleSidebar}
      />
      <Box flexGrow={1} flexShrink={1}>
        {/* spacer */}
      </Box>
      <UAVStatusSummary />
      <hr />
      {sessionExpiresAt && (
        <>
          <SessionExpiryBox expiresAt={sessionExpiresAt} />
          <hr />
        </>
      )}
      {hasFeature('toolboxMenu') && (
        <>
          <RTKStatusHeaderButton />
          <hr />
        </>
      )}
      <ConnectionStatusButton />
      <hr />
      <ServerConnectionSettingsButton />
      {hasFeature('geofence') && <GeofenceSettingsButton />}
      <AuthenticationButton />
      <hr />
      {hasFeature('toolboxMenu') && <ToolboxButton />}
      <AppSettingsButton />
      {config.urls.help ? <HelpButton /> : null}
      {window.bridge && window.bridge.isElectron ? null : <FullScreenButton />}
    </div>
  </div>
);

Header.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  sessionExpiresAt: PropTypes.number,
  toggleSidebar: PropTypes.func.isRequired,
};

export default connect(
  // mapStateToProps
  (state, { workbench }) => ({
    sessionExpiresAt: state.session.expiresAt,
    isSidebarOpen: state.sidebar.open,
    workbench,
  }),
  // mapDispatchToProps
  { toggleSidebar }
)(Header);
