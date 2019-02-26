import ActionAlarm from '@material-ui/icons/Alarm'
import ActionList from '@material-ui/icons/List'
import ActionSettingsEthernet from '@material-ui/icons/SettingsEthernet'
import DeviceDVR from '@material-ui/icons/Dvr'
import Flight from '@material-ui/icons/Flight'
import Map from '@material-ui/icons/Map'
import MapsLayers from '@material-ui/icons/Layers'
import Message from '@material-ui/icons/Message'
import MyLocation from '@material-ui/icons/MyLocation'
import ShowChart from '@material-ui/icons/ShowChart'

import PropTypes from 'prop-types'
import React from 'react'
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench'
import { connect } from 'react-redux'

import ConnectionStatusBadge from './ConnectionStatusBadge'
import LogStatusBadge from './LogStatusBadge'

const style = {
  backgroundColor: '#444',
  boxShadow: 'inset -3px -6px 6px rgba(0, 0, 0, 0.5)',
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
const SidebarPresentation = ({ open, workbench }) => (
  <div id='sidebar' style={{ ...style, overflow: 'hidden', width: open ? 240 : 48 }}>
    <div style={innerStyle}>
      <ModuleTray allowMultipleSelection vertical workbench={workbench}>
        <Module id='map' icon={<Map />} label='Map' component='map' />
        <Module id='layers' icon={<MapsLayers />} label='Layers' component='layer-list' />
        <Module id='features' icon={<ShowChart />} label='Features' component='feature-list' />
        <hr />
        <Module id='groundcontrol' icon={<DeviceDVR />} label='Ground control view' component='ground-control-view' />
        <Module id='uavs' icon={<Flight />} label='UAVs' component='uav-list' />
        <Module id='messages' icon={<Message />} label='Messages' component='messages' />
        <hr />
        <Module id='connections' badge={<ConnectionStatusBadge />} icon={<ActionSettingsEthernet />} label='Connections' component='connection-list' />
        <Module id='clocks' icon={<ActionAlarm />} label='Clocks' component='clock-list' />
        <Module id='locations' icon={<MyLocation />} label='Locations' component='saved-location-list' />
        <hr />
        <Module id='log' badge={<LogStatusBadge />} icon={<ActionList />} label='Event log' component='log-panel' />
      </ModuleTray>
    </div>
  </div>
)

SidebarPresentation.propTypes = {
  open: PropTypes.bool.isRequired,
  workbench: PropTypes.instanceOf(Workbench).isRequired
}

/**
 * Sidebar at the left edge of the main window.
 */
export const Sidebar = connect(
  // mapStateToProps
  (state, { workbench }) => ({
    ...state.sidebar, workbench
  })
)(SidebarPresentation)
