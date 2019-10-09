import PropTypes from 'prop-types';
import React from 'react';
import { Workbench } from 'react-flexible-workbench';
import { connect } from 'react-redux';
import Shapeshifter from 'react-shapeshifter';

import AppSettingsButton from './AppSettingsButton';
import AuthenticationButton from './AuthenticationButton';
import ConnectionSettingsButton from './ConnectionSettingsButton';
import FullScreenButton from './FullScreenButton';
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
const HeaderPresentation = ({ onToggleSidebar, sidebarOpen, workbench }) => (
  <div id="header" style={{ ...style, overflow: 'hidden' }}>
    <div style={innerStyle}>
      <Shapeshifter
        color="#999"
        style={{ cursor: 'pointer' }}
        shape={sidebarOpen ? 'close' : 'menu'}
        onClick={onToggleSidebar}
      />
      <div style={{ flexGrow: 1, flexShrink: 1 }}>{/* spacer */}</div>
      <hr />
      <ConnectionSettingsButton />
      <AuthenticationButton />
      <hr />
      <AppSettingsButton />
      {!window.isElectron ? <FullScreenButton /> : null}
    </div>
  </div>
);

HeaderPresentation.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  sidebarOpen: PropTypes.bool.isRequired,
  workbench: PropTypes.instanceOf(Workbench).isRequired
};

export const Header = connect(
  // mapStateToProps
  (state, { workbench }) => ({
    sidebarOpen: state.sidebar.open,
    workbench
  }),
  // mapDispatchToProps
  dispatch => ({
    onToggleSidebar() {
      dispatch(toggleSidebar());
    }
  })
)(HeaderPresentation);
