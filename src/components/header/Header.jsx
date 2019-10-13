import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Shapeshifter from 'react-shapeshifter';

import AppSettingsButton from './AppSettingsButton';
import AuthenticationButton from './AuthenticationButton';
import ConnectionStatusButton from './ConnectionStatusButton';
import FullScreenButton from './FullScreenButton';
import ServerConnectionSettingsButton from './ServerConnectionSettingsButton';
import { toggleSidebar } from '~/actions/sidebar';

const style = {
  backgroundColor: '#333',
  flexGrow: 0,
  minHeight: 48
};

const innerStyle = {
  display: 'flex',
  flexFlow: 'row nowrap'
};

/**
 * Presentation component for the header at the top edge of the main
 * window.
 *
 * @returns  {Object}  the rendered header component
 */
const HeaderPresentation = ({ onToggleSidebar, isSidebarOpen }) => (
  <div id="header" style={{ ...style, overflow: 'hidden' }}>
    <div style={innerStyle}>
      <Shapeshifter
        color="#999"
        style={{ cursor: 'pointer' }}
        shape={isSidebarOpen ? 'close' : 'menu'}
        onClick={onToggleSidebar}
      />
      <div style={{ flexGrow: 1, flexShrink: 1 }}>{/* spacer */}</div>
      <hr />
      <ConnectionStatusButton isAlwaysVisible />
      <hr />
      <ServerConnectionSettingsButton />
      <AuthenticationButton />
      <hr />
      <AppSettingsButton />
      {window.isElectron ? null : <FullScreenButton />}
    </div>
  </div>
);

HeaderPresentation.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired
};

export const Header = connect(
  // mapStateToProps
  (state, { workbench }) => ({
    isSidebarOpen: state.sidebar.open,
    workbench
  }),
  // mapDispatchToProps
  dispatch => ({
    onToggleSidebar() {
      dispatch(toggleSidebar());
    }
  })
)(HeaderPresentation);
