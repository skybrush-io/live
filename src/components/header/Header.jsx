import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Shapeshifter from 'react-shapeshifter';
import TimeAgo from 'react-timeago';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import AppSettingsButton from './AppSettingsButton';
import AuthenticationButton from './AuthenticationButton';
import ConnectionStatusButton from './ConnectionStatusButton';
import FullScreenButton from './FullScreenButton';
import HelpButton from './HelpButton';
import ServerConnectionSettingsButton from './ServerConnectionSettingsButton';

import { toggleSidebar } from '~/features/sidebar/slice';

const style = {
  backgroundColor: '#333',
  flexGrow: 0,
  minHeight: 48,
};

const innerStyle = {
  display: 'flex',
  flexFlow: 'row nowrap',
};

const SessionExpiryBox = ({ expiresAt }) => {
  return (
    <Box alignSelf="center" px={1}>
      <Typography color="textSecondary" variant="body2" align="right">Demo session expires</Typography>
      <Typography color="textPrimary" variant="body2" align="right">
        <TimeAgo date={expiresAt} />
      </Typography>
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
    <div style={innerStyle}>
      <Shapeshifter
        color='#999'
        style={{ cursor: 'pointer' }}
        shape={isSidebarOpen ? 'close' : 'menu'}
        onClick={toggleSidebar}
      />
      <Box flexGrow={1} flexShrink={1}>{/* spacer */}</Box>
      {sessionExpiresAt && <SessionExpiryBox expiresAt={sessionExpiresAt} />}
      <hr />
      <ConnectionStatusButton isAlwaysVisible />
      <hr />
      <ServerConnectionSettingsButton />
      <AuthenticationButton />
      <hr />
      <AppSettingsButton />
      {config.urls.help ? <HelpButton /> : null}
      {window.isElectron ? null : <FullScreenButton />}
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
