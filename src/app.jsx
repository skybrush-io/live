import clsx from 'clsx';
import config from 'config';
import PropTypes from 'prop-types';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { WorkbenchView } from 'react-flexible-workbench';
import { connect, Provider as StoreProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/es/integration/react';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

import { StyledEngineProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

import CornerRibbon from './components/CornerRibbon';
import dialogs from './components/dialogs';
import Header from './components/header';
import ServerConnectionManager from './components/ServerConnectionManager';
import CollectiveRTHDialog from './features/collective-rth/CollectiveRTHDialog';
import DetachedPanelManager from './features/detachable-panels/DetachedPanelManager';
import DockDetailsDialog from './features/docks/DockDetailsDialog';
import FirmwareUpdateSetupDialog from './features/firmware-update/FirmwareUpdateSetupDialog';
import AppHotkeys from './features/hotkeys/AppHotkeys';
import HotkeyDialog from './features/hotkeys/HotkeyDialog';
import PendingUAVIdOverlay from './features/hotkeys/PendingUAVIdOverlay';
import LicenseInfoDialog from './features/license-info/LicenseInfoDialog';
import MapCachingDialog from './features/map-caching/MapCachingDialog';
import CoordinateAveragingDialog from './features/measurement/CoordinateAveragingDialog';
import MissionPlannerDialog from './features/mission/MissionPlannerDialog';
import MissionProgressObserver from './features/mission/MissionProgressObserver';
import ParameterUploadSetupDialog from './features/parameters/ParameterUploadSetupDialog';
import PromptDialog from './features/prompt/PromptDialog';
import RTKSetupDialog from './features/rtk/RTKSetupDialog';
import SafetyDialog from './features/safety/SafetyDialog';
import SavedLocationEditorDialog from './features/saved-locations/SavedLocationEditorDialog';
import ShowConfiguratorDialog from './features/show-configurator/ShowConfiguratorDialog';
import Sidebar from './features/sidebar/Sidebar';
import Notifications from './features/snackbar/Notifications';
import UAVDetailsDialog from './features/uavs/UAVDetailsDialog';
import UploadDialog from './features/upload/UploadDialog';
import VersionCheckDialog from './features/version-check/VersionCheckDialog';
import {
  isWorkbenchLayoutFixed,
  shouldSidebarBeShown,
} from './features/workbench/selectors';
import ShowFileWatcher from './views/show-control/ShowFileWatcher';

import { ErrorHandler } from './error-handling';
import flock, { Flock } from './flock';
import LanguageWatcher from './i18n/LanguageWatcher';
import perspectives from './perspectives';
import rootSaga from './sagas';
import store, {
  clearStoreAfterConfirmation,
  persistor,
  sagaMiddleware,
  waitUntilStateRestored,
} from './store';
import ThemeProvider, { DarkModeExtraCSSProvider } from './theme';
import registerUploadJobTypes from './upload-jobs';
import { hasTimeLimitedSession } from './utils/configuration';
import workbench from './workbench';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

require('../assets/css/proggy-vector.css');
require('../assets/css/kbd.css');
require('../assets/css/screen.less');
require('../assets/css/tooltips.less');

const rootStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
};

const rootInnerStyle = {
  display: 'flex',
  alignItems: 'stretch',
  flexGrow: 1,
  contain: 'size',
};

/**
 * Helper function that restores the state of the workbench when it was loaded
 * back from the local storage during startup.
 */
const restoreWorkbench = (whenDone) => async () => {
  const state = store.getState();

  if (state && state.workbench && state.workbench.state) {
    workbench.restoreState(state.workbench.state);
  }

  if (whenDone) {
    whenDone();
  }
};

// Spin up the root saga after the state has been restored.
waitUntilStateRestored().then(() => {
  const disposer = registerUploadJobTypes();
  const sagaTask = sagaMiddleware.run(rootSaga);
  if (module.hot) {
    module.hot.dispose(() => {
      disposer();
      sagaTask.cancel();
    });
  }
});

const WorkbenchContainerPresentation = ({ isFixed, showSidebar }) => (
  <div className={clsx(isFixed && 'workbench-fixed')} style={rootInnerStyle}>
    {showSidebar ? <Sidebar workbench={workbench} /> : null}
    <WorkbenchView workbench={workbench} />
  </div>
);

WorkbenchContainerPresentation.propTypes = {
  isFixed: PropTypes.bool,
  showSidebar: PropTypes.bool,
};

const WorkbenchContainer = connect(
  // mapStateToProps
  (state) => ({
    isFixed: isWorkbenchLayoutFixed(state),
    showSidebar: shouldSidebarBeShown(state),
  }),
  // mapDispatchToProps
  null
)(WorkbenchContainerPresentation);

const App = ({ onFirstRender }) => (
  <PersistGate
    persistor={persistor}
    onBeforeLift={restoreWorkbench(onFirstRender)}
  >
    <>
      <CssBaseline />

      <DarkModeExtraCSSProvider />

      <AppHotkeys />

      <div style={rootStyle}>
        <Header perspectives={perspectives} workbench={workbench} />
        <WorkbenchContainer />
        {config?.ribbon?.label && <CornerRibbon {...config.ribbon} />}
        <PendingUAVIdOverlay />
      </div>

      <DetachedPanelManager />

      <ServerConnectionManager />

      <LanguageWatcher />
      <MissionProgressObserver />
      <ShowFileWatcher />

      <dialogs.AppSettingsDialog />
      <dialogs.AuthenticationDialog />
      <dialogs.DeauthenticationDialog />
      <dialogs.FeatureEditorDialog />
      <dialogs.FlyToTargetDialog />
      <dialogs.GlobalErrorDialog />
      <dialogs.LayerSettingsDialog />
      <dialogs.ServerSettingsDialog />
      {hasTimeLimitedSession && <dialogs.SessionExpiryDialog />}
      <dialogs.TimeSyncDialog />

      <CollectiveRTHDialog />
      <CoordinateAveragingDialog />
      <DockDetailsDialog />
      <FirmwareUpdateSetupDialog />
      <HotkeyDialog />
      <LicenseInfoDialog />
      <MapCachingDialog />
      <MissionPlannerDialog />
      <ParameterUploadSetupDialog />
      <PromptDialog />
      <RTKSetupDialog />
      <SafetyDialog />
      <SavedLocationEditorDialog />
      <ShowConfiguratorDialog />
      <UAVDetailsDialog />
      <UploadDialog />
      <VersionCheckDialog />

      <Notifications />
    </>
  </PersistGate>
);

App.propTypes = {
  onFirstRender: PropTypes.func,
};

/**
 * Placeholder component to render when a panel is being dragged from the
 * sidebar to the workbench.
 */
const DragProxy = () => <div className='drag-proxy' />;

/**
 * We need to revert to the legacy style injection method to
 * stay compatible with our `ExternalWindow` implementation.
 * NOTE: The `speedy: false` option is not documented as of committing
 * this, but it is suggested by the developers in GitHub discussions,
 * so I assume that it is actually meant to be part of the public API:
 * https://github.com/emotion-js/emotion/discussions/2903#discussioncomment-3737996
 */
const styleCache = createCache({ key: 'style-cache', speedy: false });

/**
 * The context provider for the main application component and the
 * individual application panels.
 *
 * react-flexible-workbench likes class components at the top so that's why
 * we are returning a class.
 */
const enhancer = (Component) =>
  class extends React.Component {
    static displayName = 'WorkbenchRoot';
    static propTypes = {
      glDragging: PropTypes.bool,
    };

    render() {
      if (this.props.glDragging) {
        return (
          <ErrorBoundary
            FallbackComponent={ErrorHandler}
            onReset={clearStoreAfterConfirmation}
          >
            <DragProxy />
          </ErrorBoundary>
        );
      }

      return (
        <ErrorBoundary
          FallbackComponent={ErrorHandler}
          onReset={clearStoreAfterConfirmation}
        >
          <StoreProvider store={store}>
            <StyledEngineProvider injectFirst>
              <CacheProvider value={styleCache}>
                <ThemeProvider>
                  <Flock.Provider value={flock}>
                    <Component {...this.props} />
                  </Flock.Provider>
                </ThemeProvider>
              </CacheProvider>
            </StyledEngineProvider>
          </StoreProvider>
        </ErrorBoundary>
      );
    }
  };

workbench.hoc = enhancer;
export default enhancer(App);
