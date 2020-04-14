import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Shapeshifter from 'react-shapeshifter';

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

/**
 * Presentation component for the header at the top edge of the main
 * window.
 *
 * @returns  {Object}  the rendered header component
 */
const Header = ({ toggleSidebar, isSidebarOpen }) => (
  <div id='header' style={{ ...style, overflow: 'hidden' }}>
    <div style={innerStyle}>
      <Shapeshifter
        color='#999'
        style={{ cursor: 'pointer' }}
        shape={isSidebarOpen ? 'close' : 'menu'}
        onClick={() => toggleSidebar()}
      />
      <div style={{ flexGrow: 1, flexShrink: 1 }}>{/* spacer */}</div>
      <hr />
      <ConnectionStatusButton isAlwaysVisible />
      <hr />
      <ServerConnectionSettingsButton />
      <AuthenticationButton />
      <hr />
      <AppSettingsButton />
      {config.helpUrl ? <HelpButton /> : null}
      {window.isElectron ? null : <FullScreenButton />}
    </div>
  </div>
);

Header.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default connect(
  // mapStateToProps
  (state, { workbench }) => ({
    isSidebarOpen: state.sidebar.open,
    workbench,
  }),
  // mapDispatchToProps
  { toggleSidebar }
)(Header);
