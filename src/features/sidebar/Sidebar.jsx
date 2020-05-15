import Alarm from '@material-ui/icons/Alarm';
import Apps from '@material-ui/icons/Apps';
import Flight from '@material-ui/icons/Flight';
import Gamepad from '@material-ui/icons/Gamepad';
import Grain from '@material-ui/icons/Grain';
import Layers from '@material-ui/icons/Layers';
import Map from '@material-ui/icons/Map';
import Message from '@material-ui/icons/Message';
import MyLocation from '@material-ui/icons/MyLocation';
import Notifications from '@material-ui/icons/Notifications';
import ShowChart from '@material-ui/icons/ShowChart';
// import Storage from '@material-ui/icons/Storage';
import ThreeDRotation from '@material-ui/icons/ThreeDRotation';

import PropTypes from 'prop-types';
import React from 'react';
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench';
import { connect } from 'react-redux';

import LogStatusBadge from '~/components/badges/LogStatusBadge';

const style = {
  backgroundColor: '#333',
  boxShadow: 'rgba(0, 0, 0, 0.3) -9px -3px 6px -6px inset',
  height: '100%',
};

const innerStyle = {
  display: 'flex',
  flexFlow: 'column nowrap',
  height: '100%',
  width: 240,
};

/**
 * Presentation component for the sidebar at the left edge of the main
 * window.
 *
 * @returns  {Object}  the rendered sidebar component
 */
const Sidebar = ({ isOpen, workbench }) => (
  <div
    id='sidebar'
    style={{ ...style, overflow: 'hidden', width: isOpen ? 240 : 48 }}
  >
    <div style={innerStyle}>
      <ModuleTray allowMultipleSelection vertical workbench={workbench}>
        <Module id='map' icon={<Map />} label='Map' component='map' />
        <Module
          id='threeDView'
          icon={<ThreeDRotation />}
          label='3D View'
          component='three-d-view'
          reorderEnabled={false}
        />
        <Module
          id='layers'
          icon={<Layers />}
          label='Layers'
          component='layer-list'
        />
        <Module
          id='features'
          icon={<ShowChart />}
          label='Features'
          component='feature-list'
        />
        <hr />
        <Module id='uavs' icon={<Flight />} label='UAVs' component='uav-list' />
        <Module
          id='docks'
          icon={<Gamepad />}
          label='Docks'
          component='dock-list'
        />
        <Module
          id='messages'
          icon={<Message />}
          label='Messages'
          component='messages'
        />
        <hr />
        <Module
          id='show'
          icon={<Grain />}
          label='Show control'
          component='show-control'
        />
        <hr />
        <Module
          id='clocks'
          icon={<Alarm />}
          label='Clocks'
          component='lcd-clock-panel'
        />
        {/*
        <Module
          id="datasets"
          icon={<Storage />}
          label="Datasets"
          component="dataset-list"
        />
        */}
        <Module
          id='locations'
          icon={<MyLocation />}
          label='Locations'
          component='saved-location-list'
        />
        <hr />
        <Module
          id='log'
          badge={<LogStatusBadge />}
          icon={<Notifications />}
          label='Event log'
          component='log-panel'
        />
      </ModuleTray>
    </div>
  </div>
);

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  workbench: PropTypes.instanceOf(Workbench).isRequired,
};

/**
 * Sidebar at the left edge of the main window.
 */
export default connect(
  // mapStateToProps
  (state, { workbench }) => ({
    isOpen: state.sidebar.open,
    workbench,
  })
)(Sidebar);
