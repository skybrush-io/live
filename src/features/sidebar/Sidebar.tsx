import type { FunctionComponent } from 'react';

import Alarm from '@mui/icons-material/Alarm';
import Assignment from '@mui/icons-material/Assignment';
import Flight from '@mui/icons-material/Flight';
import FormatListBulleted from '@mui/icons-material/FormatListBulleted';
import Gamepad from '@mui/icons-material/Gamepad';
import Grain from '@mui/icons-material/Grain';
import Layers from '@mui/icons-material/Layers';
import Map from '@mui/icons-material/Map';
import Place from '@mui/icons-material/Place';
import ThreeDRotation from '@mui/icons-material/ThreeDRotation';
import WbSunny from '@mui/icons-material/WbSunny';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Workbench } from 'react-flexible-workbench';
import { Module, ModuleTray } from 'react-flexible-workbench';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import LogStatusBadge from '~/components/badges/LogStatusBadge';
import { getMissionType } from '~/features/mission/selectors';
import { areExperimentalFeaturesEnabled } from '~/features/settings/selectors';
import Antenna from '~/icons/Antenna';
import ConnectingAirports from '~/icons/ConnectingAirports';
import HomeCircleOutlined from '~/icons/HomeCircleOutlined';
import Route from '~/icons/Route';
import ShapeLine from '~/icons/ShapeLine';
import type { MissionType } from '~/model/missions';
import type { RootState } from '~/store/reducers';
import { hasFeature } from '~/utils/configuration';

import { isSidebarOpen } from './selectors';

declare const VERSION: string;

const SIDEBAR_OPEN_WIDTH = 180;

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

type SidebarProps = {
  experimentalFeaturesEnabled: boolean;
  isOpen: boolean;
  missionType: MissionType | null;
  workbench: Workbench;
} & WithTranslation;

const Sidebar: FunctionComponent<SidebarProps> = ({
  experimentalFeaturesEnabled,
  isOpen,
  missionType,
  t,
  workbench,
}) => {
  const moduleComponent = (component: string) =>
    component as unknown as React.ComponentType<any>;

  return (
    <div
      id='sidebar'
      style={{ ...style, width: isOpen ? SIDEBAR_OPEN_WIDTH : 48 }}
    >
      <div style={innerStyle}>
        <ModuleTray allowMultipleSelection vertical workbench={workbench}>
          <Module
            id='map'
            icon={<Map />}
            label={t('view.map')}
            component={moduleComponent('map')}
          />
          <Module
            id='threeDView'
            icon={<ThreeDRotation />}
            label={t('view.three-d-view')}
            component={moduleComponent('three-d-view')}
            reorderEnabled={false}
          />
          <Module
            id='layers'
            icon={<Layers />}
            label={t('view.layer-list')}
            component={moduleComponent('layer-list')}
          />
          {hasFeature('mapFeatures') && (
            <Module
              id='features'
              icon={<ShapeLine />}
              label={t('view.feature-list')}
              component={moduleComponent('feature-list')}
            />
          )}
          <hr />
          <Module
            id='uavDetails'
            icon={<Flight />}
            label={t('view.uav-details')}
            component={moduleComponent('uav-details')}
          />
          <Module
            id='uavList'
            icon={<ConnectingAirports />}
            label={t('view.uav-list')}
            component={moduleComponent('uav-list')}
          />
          <Module
            id='collectiveRTH'
            icon={<HomeCircleOutlined />}
            label={t('view.collective-rth')}
            component={moduleComponent('collective-rth')}
          />
          {hasFeature('beacons') && (
            <Module
              id='beacons'
              icon={<Antenna />}
              label={t('view.beacon-list')}
              component={moduleComponent('beacon-list')}
            />
          )}
          {hasFeature('docks') && experimentalFeaturesEnabled && (
            <Module
              id='docks'
              icon={<Gamepad />}
              label={t('view.dock-list')}
              component={moduleComponent('dock-list')}
            />
          )}
          <hr />
          {hasShowControl && (
            <Module
              id='show'
              icon={<Grain />}
              label={t('view.show-control')}
              component={moduleComponent('show-control')}
            />
          )}
          {hasShowControl && (
            <Module
              id='lights'
              icon={<WbSunny />}
              label={t('view.light-control')}
              component={moduleComponent('light-control')}
            />
          )}
          {hasShowControl && <hr />}
          {hasMissionEditor && (
            <Module
              id='missionEditor'
              icon={<Route />}
              label={t('view.mission-editor')}
              component={moduleComponent('mission-editor')}
            />
          )}
          {(hasShowControl || hasMissionEditor) && <hr />}
          <Module
            id='clocks'
            icon={<Alarm />}
            label={t('view.lcd-clock-panel')}
            component={moduleComponent('lcd-clock-panel')}
          />
          <Module
            id='locations'
            icon={<Place />}
            label={t('view.saved-location-list')}
            component={moduleComponent('saved-location-list')}
          />
          <hr />
          <Module
            id='notes'
            icon={<Assignment />}
            label={t('view.field-notes')}
            component={moduleComponent('field-notes')}
          />
          <Module
            id='log'
            badge={<LogStatusBadge />}
            icon={<FormatListBulleted />}
            label={t('view.log-panel')}
            component={moduleComponent('log-panel')}
          />
        </ModuleTray>
      </div>
      {isOpen && (
        <Box
          style={{ color: '#fff', opacity: 0.3, width: SIDEBAR_OPEN_WIDTH }}
          sx={{ py: 0.5, px: 1 }}
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
};

type StateProps = Pick<
  SidebarProps,
  'experimentalFeaturesEnabled' | 'isOpen' | 'missionType'
>;
type OwnProps = Pick<SidebarProps, 'workbench'>;

const ConnectedSidebar = connect<StateProps, unknown, OwnProps, RootState>(
  (state, { workbench }) => ({
    experimentalFeaturesEnabled: areExperimentalFeaturesEnabled(state),
    isOpen: isSidebarOpen(state),
    missionType: getMissionType(state),
    workbench,
  })
)(withTranslation()(Sidebar));

export default ConnectedSidebar;
