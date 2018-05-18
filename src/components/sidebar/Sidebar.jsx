import ActionAlarm from 'material-ui-icons/Alarm'
import ActionList from 'material-ui-icons/List'
import ActionSettingsEthernet from 'material-ui-icons/SettingsEthernet'
import DeviceDVR from 'material-ui-icons/Dvr'
import Flight from 'material-ui-icons/Flight'
import Map from 'material-ui-icons/Map'
import MapsLayers from 'material-ui-icons/Layers'
import Message from 'material-ui-icons/Message'
import MyLocation from 'material-ui-icons/MyLocation'
import ShowChart from 'material-ui-icons/ShowChart'

import PropTypes from 'prop-types'
import React from 'react'
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench'
import { connect } from 'react-redux'
import Shapeshifter from 'react-shapeshifter'

import { toggleSidebar } from '../../actions/sidebar'

import AppSettingsButton from './AppSettingsButton'
import ConnectionSettingsButton from './ConnectionSettingsButton'
import ConnectionStatusBadge from './ConnectionStatusBadge'
import FullScreenButton from './FullScreenButton'
import LogStatusBadge from './LogStatusBadge'

const style = {
  backgroundColor: '#333',
  boxShadow: 'inset -3px 0 6px rgba(0, 0, 0, 0.5)',
  height: '100%'
}

const innerStyle = {
  display: 'flex',
  flexFlow: 'column nowrap',
  height: '100%',
  width: 240
}

/**
 * Presentation component for the sidebar at the left edge of the main
 * window.
 *
 * @returns  {Object}  the rendered sidebar component
 */
const SidebarPresentation = ({ open, onToggleSidebar, workbench }) => (
  <div id='sidebar' style={{ ...style, overflow: 'hidden', width: open ? 240 : 48 }}>
    <div style={innerStyle}>
      <Shapeshifter
        color='#999'
        style={{ cursor: 'pointer' }}
        shape={open ? 'close' : 'menu'}
        onClick={onToggleSidebar}
      />
      <hr />
      <ModuleTray allowMultipleSelection vertical workbench={workbench}>
        <Module id='map' icon={<Map color='action' />} label='Map' component='map' />
        <Module id='layers' icon={<MapsLayers color='action' />} label='Layers' component='layer-list' />
        <Module id='features' icon={<ShowChart color='action' />} label='Features' component='feature-list' />
        <hr />
        <Module id='groundcontrol' icon={<DeviceDVR color='action' />} label='Ground Control View' component='ground-control-view' />
        <Module id='uavs' icon={<Flight color='action' />} label='UAVs' component='uav-list' />
        <Module id='messages' icon={<Message color='action' />} label='Messages' component='messages' />
        <hr />
        <Module id='connections' badge={<ConnectionStatusBadge />} icon={<ActionSettingsEthernet color='action' />} label='Connections' component='connection-list' />
        <Module id='clocks' icon={<ActionAlarm color='action' />} label='Clocks' component='clock-list' />
        <Module id='locations' icon={<MyLocation color='action' />} label='Locations' component='saved-location-list' />
        <hr />
        <Module id='log' badge={<LogStatusBadge />} icon={<ActionList color='action' />} label='Event log' component='log-panel' />
      </ModuleTray>
      <hr />
      <div style={{ flexGrow: 1, flexShrink: 1 }}>{ /* spacer */ }</div>
      <hr />
      <AppSettingsButton />
      <ConnectionSettingsButton />
      {!window.isElectron ? <FullScreenButton /> : null}
    </div>
  </div>
)

SidebarPresentation.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  workbench: PropTypes.instanceOf(Workbench).isRequired
}

/**
 * Sidebar at the left edge of the main window.
 */
const Sidebar = connect(
  // mapStateToProps
  (state, { workbench }) => ({
    ...state.sidebar, workbench
  }),
  // mapDispatchToProps
  dispatch => ({
    onToggleSidebar () {
      dispatch(toggleSidebar())
    }
  })
)(SidebarPresentation)

export default Sidebar
