/* global VERSION */

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Alarm from '@material-ui/icons/Alarm';
// import Apps from '@material-ui/icons/Apps';
import Assignment from '@material-ui/icons/Assignment';
import Flight from '@material-ui/icons/Flight';
import Gamepad from '@material-ui/icons/Gamepad';
import Grain from '@material-ui/icons/Grain';
import Layers from '@material-ui/icons/Layers';
import Map from '@material-ui/icons/Map';
import Place from '@material-ui/icons/Place';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
// import Storage from '@material-ui/icons/Storage';
import ThreeDRotation from '@material-ui/icons/ThreeDRotation';
import WbSunny from '@material-ui/icons/WbSunny';

import PropTypes from 'prop-types';
import React from 'react';
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench';
import { connect } from 'react-redux';

import LogStatusBadge from '~/components/badges/LogStatusBadge';
import { areExperimentalFeaturesEnabled } from '~/features/settings/selectors';
import Antenna from '~/icons/Antenna';
import ShapeLine from '~/icons/ShapeLine';
import { hasFeature } from '~/utils/configuration';

import { isSidebarOpen } from './selectors';

// NOTE: The scrollbar is not only OS dependent, but also browser dependent.
const SIDEBAR_OPEN_WIDTH = 180; /* 160px is enough for most platforms, but apparently Windows needs 180px because of the scrollbar */

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

const hasShowControl = hasFeature('showControl');

/**
 * Presentation component for the sidebar at the left edge of the main
 * window.
 *
 * @returns  {Object}  the rendered sidebar component
 */
const Sidebar = ({ experimentalFeaturesEnabled, isOpen, workbench }) => (
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
            icon={<ShapeLine />}
            label='Features'
            component='feature-list'
          />
        )}
        <hr />
        <Module id='uavs' icon={<Flight />} label='UAVs' component='uav-list' />
        {hasFeature('beacons') && (
          <Module
            id='beacons'
            icon={<Antenna />}
            label='Beacons'
            component='beacon-list'
          />
        )}
        {hasFeature('docks') && experimentalFeaturesEnabled && (
          <Module
            id='docks'
            icon={<Gamepad />}
            label='Docks'
            component='dock-list'
          />
        )}
        <hr />
        {/* Do not use a single React fragment here for the next section; it would confuse `react-flexible-workbench` */}
        {hasShowControl && (
          <Module
            id='show'
            icon={<Grain />}
            label='Show control'
            component='show-control'
          />
        )}
        {hasShowControl && (
          <Module
            id='lights'
            icon={<WbSunny />}
            label='Light control'
            component='light-control'
          />
        )}
        {hasShowControl && <hr />}
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
          icon={<Place />}
          label='Locations'
          component='saved-location-list'
        />
        <hr />
        <Module
          id='notes'
          icon={<Assignment />}
          label='Field notes'
          component='field-notes'
        />
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
  experimentalFeaturesEnabled: PropTypes.bool,
  isOpen: PropTypes.bool,
  workbench: PropTypes.instanceOf(Workbench).isRequired,
};

/**
 * Sidebar at the left edge of the main window.
 */
export default connect(
  // mapStateToProps
  (state, { workbench }) => ({
    experimentalFeaturesEnabled: areExperimentalFeaturesEnabled(state),
    isOpen: isSidebarOpen(state),
    workbench,
  })
)(Sidebar);
