/* global VERSION */

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Alarm from '@material-ui/icons/Alarm';
// import Apps from '@material-ui/icons/Apps';
import Flight from '@material-ui/icons/Flight';
import Gamepad from '@material-ui/icons/Gamepad';
import Grain from '@material-ui/icons/Grain';
import Layers from '@material-ui/icons/Layers';
import Map from '@material-ui/icons/Map';
import MyLocation from '@material-ui/icons/MyLocation';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import ShowChart from '@material-ui/icons/ShowChart';
// import Storage from '@material-ui/icons/Storage';
import ThreeDRotation from '@material-ui/icons/ThreeDRotation';
import WbSunny from '@material-ui/icons/WbSunny';

import PropTypes from 'prop-types';
import React from 'react';
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench';
import { connect } from 'react-redux';

import LogStatusBadge from '~/components/badges/LogStatusBadge';
import { hasFeature } from '~/utils/configuration';

const SIDEBAR_OPEN_WIDTH = 160;

const style = {
  backgroundColor: '#333',
  boxShadow: 'rgba(0, 0, 0, 0.3) -9px -3px 6px -6px inset',
  display: 'flex',
  flexFlow: 'column nowrap',
  height: 'calc(100vh - 48px)',
  overflow: 'hidden',
};

const innerStyle = {
  display: 'flex',
  flexFlow: 'column nowrap',
  flexGrow: 1,
  overflow: 'auto',
  width: SIDEBAR_OPEN_WIDTH,
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
    style={{ ...style, width: isOpen ? SIDEBAR_OPEN_WIDTH : 48 }}
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
        {hasFeature('features') && (
          <Module
            id='features'
            icon={<ShowChart />}
            label='Features'
            component='feature-list'
          />
        )}
        <hr />
        <Module id='uavs' icon={<Flight />} label='UAVs' component='uav-list' />
        {hasFeature('docks') && (
          <Module
            id='docks'
            icon={<Gamepad />}
            label='Docks'
            component='dock-list'
          />
        )}
        <hr />
        {/* Do not use a single React fragment here for the next section; it would confuse `react-flexible-workbench` */}
        {hasFeature('showControl') && (
          <Module
            id='show'
            icon={<Grain />}
            label='Show control'
            component='show-control'
          />
        )}
        {hasFeature('showControl') && (
          <Module
            id='lights'
            icon={<WbSunny />}
            label='Light control'
            component='light-control'
          />
        )}
        {hasFeature('showControl') && <hr />}
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
          icon={<FormatListBulleted />}
          label='Event log'
          component='log-panel'
        />
      </ModuleTray>
    </div>
    {isOpen && (
      <Box
        py={0.5}
        px={1}
        style={{ color: '#fff', opacity: 0.3, width: SIDEBAR_OPEN_WIDTH }}
      >
        <Typography align='center' variant='caption' component='footer'>
          {VERSION}
        </Typography>
      </Box>
    )}
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
