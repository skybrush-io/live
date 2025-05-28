/* global VERSION */

import Alarm from '@mui/icons-material/Alarm';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// import Apps from '@mui/icons-material/Apps';
import Assignment from '@mui/icons-material/Assignment';
import Flight from '@mui/icons-material/Flight';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import Gamepad from '@mui/icons-material/Gamepad';
import Grain from '@mui/icons-material/Grain';
import Layers from '@mui/icons-material/Layers';
import Map from '@mui/icons-material/Map';
import Place from '@mui/icons-material/Place';
// import Storage from '@mui/icons-material/Storage';
import ThreeDRotation from '@mui/icons-material/ThreeDRotation';
import WbSunny from '@mui/icons-material/WbSunny';
import PropTypes from 'prop-types';
import React from 'react';
import { Module, ModuleTray, Workbench } from 'react-flexible-workbench';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import LogStatusBadge from '~/components/badges/LogStatusBadge';
import { getMissionType } from '~/features/mission/selectors';
import { areExperimentalFeaturesEnabled } from '~/features/settings/selectors';
import Antenna from '~/icons/Antenna';
import ConnectingAirports from '~/icons/ConnectingAirports';
import Route from '~/icons/Route';
import ShapeLine from '~/icons/ShapeLine';
import { MissionType } from '~/model/missions';
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

const hasMissionEditor = hasFeature('missionEditor');
const hasShowControl = hasFeature('showControl');

/**
 * Presentation component for the sidebar at the left edge of the main
 * window.
 *
 * @returns  {Object}  the rendered sidebar component
 */
const Sidebar = ({
  experimentalFeaturesEnabled,
  isOpen,
  missionType,
  t,
  workbench,
}) => (
  <div
    id='sidebar'
    style={{ ...style, width: isOpen ? SIDEBAR_OPEN_WIDTH : 48 }}
  >
    <div style={innerStyle}>
      <ModuleTray allowMultipleSelection vertical workbench={workbench}>
        <Module id='map' icon={<Map />} label={t('view.map')} component='map' />
        <Module
          id='threeDView'
          icon={<ThreeDRotation />}
          label={t('view.three-d-view')}
          component='three-d-view'
          reorderEnabled={false}
        />
        <Module
          id='layers'
          icon={<Layers />}
          label={t('view.layer-list')}
          component='layer-list'
        />
        {hasFeature('mapFeatures') && (
          <Module
            id='features'
            icon={<ShapeLine />}
            label={t('view.feature-list')}
            component='feature-list'
          />
        )}
        <hr />
        <Module
          id='uavDetails'
          icon={<Flight />}
          label={t('view.uav-details')}
          component='uav-details'
        />
        <Module
          id='uavList'
          icon={<ConnectingAirports />}
          label={t('view.uav-list')}
          component='uav-list'
        />
        {hasFeature('beacons') && (
          <Module
            id='beacons'
            icon={<Antenna />}
            label={t('view.beacon-list')}
            component='beacon-list'
          />
        )}
        {hasFeature('docks') && experimentalFeaturesEnabled && (
          <Module
            id='docks'
            icon={<Gamepad />}
            label={t('view.dock-list')}
            component='dock-list'
          />
        )}
        <hr />
        {/* Do not use a single React fragment here for the next section; it would confuse `react-flexible-workbench` */}
        {hasShowControl && (
          <Module
            id='show'
            icon={<Grain />}
            label={t('view.show-control')}
            component='show-control'
          />
        )}
        {hasShowControl && (
          <Module
            id='lights'
            icon={<WbSunny />}
            label={t('view.light-control')}
            component='light-control'
          />
        )}
        {hasShowControl && <hr />}
        {hasMissionEditor && (
          <Module
            id='missionEditor'
            icon={<Route />}
            label={t('view.mission-editor')}
            component='mission-editor'
          />
        )}
        {(hasShowControl || hasMissionEditor) && <hr />}
        <Module
          id='clocks'
          icon={<Alarm />}
          label={t('view.lcd-clock-panel')}
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
          label={t('view.saved-location-list')}
          component='saved-location-list'
        />
        <hr />
        <Module
          id='notes'
          icon={<Assignment />}
          label={t('view.field-notes')}
          component='field-notes'
        />
        <Module
          id='log'
          badge={<LogStatusBadge />}
          icon={<FormatListBulleted />}
          label={t('view.log-panel')}
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
        {missionType && (
          <Typography align='center' variant='caption' component='footer'>
            {t('sidebar.missionType', { missionType })}
          </Typography>
        )}
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
  missionType: PropTypes.oneOf(Object.values(MissionType)),
  t: PropTypes.func,
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
    missionType: getMissionType(state),
    workbench,
  })
)(withTranslation()(Sidebar));
