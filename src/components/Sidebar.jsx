import ActionAlarm from 'material-ui/svg-icons/action/alarm'
import ActionList from 'material-ui/svg-icons/action/list'
import ActionSettingsEthernet from 'material-ui/svg-icons/action/settings-ethernet'
import Flight from 'material-ui/svg-icons/maps/flight'
import Map from 'material-ui/svg-icons/maps/map'
import Message from 'material-ui/svg-icons/communication/message'
import MyLocation from 'material-ui/svg-icons/maps/my-location'

import PropTypes from 'prop-types'
import React from 'react'
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench'
import { connect } from 'react-redux'
import Shapeshifter from 'react-shapeshifter'

import { toggleSidebar } from '../actions/sidebar'

const style = {
  backgroundColor: '#333',
  boxShadow: 'inset -3px 0 6px rgba(0, 0, 0, 0.5)',
  height: '100%'
}

/**
 * Presentation component for the sidebar at the left edge of the main
 * window.
 *
 * @returns  {Object}  the rendered sidebar component
 */
const SidebarPresentation = ({ open, onToggleSidebar, workbench }) => (
  <div id="sidebar" style={{ ...style, overflow: 'hidden', width: open ? 240 : 48 }}>
    <div style={{ width: 240 }}>
      <Shapeshifter color="#999" shape={ open ? 'close' : 'menu' } onClick={onToggleSidebar} />
      <hr />
      <ModuleTray allowMultipleSelection vertical workbench={workbench}>
        <Module id="map" icon={<Map color="white" />} label="Map" component="map" />
        <hr />
        <Module id="uavs" icon={<Flight color="white" />} label="UAVs" component="uav-list" />
        <Module id="messages" icon={<Message color="white" />} label="Messages" component="messages" />
        <hr />
        <Module id="connections" icon={<ActionSettingsEthernet color="white" />} label="Connections" component="connection-list" />
        <Module id="clocks" icon={<ActionAlarm color="white" />} label="Clocks" component="clock-list" />
        <Module id="locations" icon={<MyLocation color="white" />} label="Locations" component="saved-location-list" />
        <hr />
        <Module id="log" icon={<ActionList color="white" />} label="Event log" component="log-panel" />
        <hr />
      </ModuleTray>
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
