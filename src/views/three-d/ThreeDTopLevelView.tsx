/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import loadable from '@loadable/component';
import Settings from '@mui/icons-material/Settings';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import { useRef } from 'react';
import { IgnoreKeys } from 'react-hotkeys';
import { connect } from 'react-redux';
import { useResizeObserver } from 'usehooks-ts';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

import DarkModeSwitch from '~/components/DarkModeSwitch';
import ToolbarDivider from '~/components/ToolbarDivider';
import NearestItemTooltip from '~/features/session/NearestItemTooltip';
import {
  setAppSettingsDialogTab,
  showAppSettingsDialog,
} from '~/features/settings/actions';
import { getLightingConditionsForThreeDView } from '~/features/settings/selectors';
import { toggleLightingConditionsInThreeDView } from '~/features/settings/slice';
import { AppSettingsDialogTab } from '~/features/settings/types';
import { resetZoom, rotateViewToDrones } from '~/features/three-d/actions';
import { cameraRef } from '~/features/three-d/refs';
import { setNavigationMode } from '~/features/three-d/slice';
import type {
  NavigationMode,
  NavigationSettings,
} from '~/features/three-d/types';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';
import type { AppDispatch, RootState } from '~/store/reducers';

import NavigationButtonGroup from './NavigationButtonGroup';
import NavigationInstructions from './NavigationInstructions';
import Overlay from './Overlay';

const ThreeDView = loadable(
  () => import(/* webpackChunkName: "three-d" */ './ThreeDView')
);

const useStyles = makeStyles((theme) => ({
  appBar: {
    backgroundColor: isThemeDark(theme)
      ? '#424242'
      : theme.palette.background.paper,
    height: 48,
  },

  toolbar: {
    position: 'absolute',
    left: theme.spacing(1),
    right: theme.spacing(1),
    top: 0,
  },
}));

type Props = {
  hasMapCoordinateSystem: boolean;
  lighting: 'dark' | 'light';
  navigation: NavigationSettings;
  onResetZoom: () => void;
  onRotateCameraTowardsDrones: () => void;
  onSetNavigationMode: (mode: NavigationMode) => void;
  onShowSettings: () => void;
  onToggleLightingConditions: () => void;
};

type ResizableHTMLElement = HTMLElement & { resize: () => void };

const ThreeDTopLevelView = ({
  hasMapCoordinateSystem,
  lighting,
  navigation,
  onResetZoom,
  onRotateCameraTowardsDrones,
  onSetNavigationMode,
  onShowSettings,
  onToggleLightingConditions,
}: Props) => {
  const classes = useStyles();

  const threeDViewRef = useRef<ResizableHTMLElement>(null!);
  const ref = useRef<HTMLDivElement>(null);

  useResizeObserver<HTMLDivElement>({
    ref: ref as React.RefObject<HTMLDivElement>,
    onResize() {
      if (threeDViewRef.current) {
        threeDViewRef.current.resize();
      }
    },
  });

  return (
    <IgnoreKeys style={{ height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppBar color='default' position='static' className={classes.appBar}>
          <Toolbar disableGutters variant='dense' className={classes.toolbar}>
            <NavigationButtonGroup
              mode={navigation.mode}
              onChange={onSetNavigationMode}
              onResetZoom={onResetZoom}
              onRotateCameraTowardsDrones={onRotateCameraTowardsDrones}
            />
            <ToolbarDivider orientation='vertical' />
            <NavigationInstructions mode={navigation.mode} />
            <DarkModeSwitch
              selected={lighting === 'dark'}
              onChange={onToggleLightingConditions}
            />
          </Toolbar>
        </AppBar>
        <Box ref={ref} sx={{ position: 'relative', flex: 1 }}>
          <NearestItemTooltip>
            <ThreeDView ref={threeDViewRef} cameraRef={cameraRef} />
          </NearestItemTooltip>
          {!hasMapCoordinateSystem && (
            <Overlay left={8} right={8} top={8}>
              <Alert
                severity='warning'
                action={
                  <IconButton
                    color='inherit'
                    size='small'
                    onClick={onShowSettings}
                  >
                    <Settings />
                  </IconButton>
                }
              >
                <AlertTitle>No map coordinate system specified</AlertTitle>
                <div>
                  Drones will become visible when a coordinate system is
                  specified in the <strong>Settings</strong> dialog.
                </div>
              </Alert>
            </Overlay>
          )}
        </Box>
      </Box>
    </IgnoreKeys>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    hasMapCoordinateSystem: isMapCoordinateSystemSpecified(state),
    ...state.threeD,
    lighting: getLightingConditionsForThreeDView(state),
  }),
  // mapDispatchToProps
  {
    onResetZoom: resetZoom,
    onRotateCameraTowardsDrones: rotateViewToDrones,
    onSetNavigationMode: setNavigationMode,

    onShowSettings: () => (dispatch: AppDispatch) => {
      dispatch(setAppSettingsDialogTab(AppSettingsDialogTab.DISPLAY));
      dispatch(showAppSettingsDialog());
    },

    onToggleLightingConditions: toggleLightingConditionsInThreeDView,
  }
)(ThreeDTopLevelView);
