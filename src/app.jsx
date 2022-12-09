import config from 'config';
import PropTypes from 'prop-types';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { WorkbenchView } from 'react-flexible-workbench';
import { Provider as StoreProvider } from 'react-redux';
import { ToastProvider } from 'react-toast-notifications';
import { PersistGate } from 'redux-persist/es/integration/react';

import loadable from '@loadable/component';
import CssBaseline from '@material-ui/core/CssBaseline';

import dialogs from './components/dialogs';
import Header from './components/header';
import CornerRibbon from './components/CornerRibbon';
import ServerConnectionManager from './components/ServerConnectionManager';
import ShowFileWatcher from './views/show-control/ShowFileWatcher';

import DetachedPanelManager from './features/detachable-panels/DetachedPanelManager';
import DockDetailsDialog from './features/docks/DockDetailsDialog';
import AppHotkeys from './features/hotkeys/AppHotkeys';
import HotkeyDialog from './features/hotkeys/HotkeyDialog';
import PendingUAVIdOverlay from './features/hotkeys/PendingUAVIdOverlay';
import LicenseInfoDialog from './features/license-info/LicenseInfoDialog';
import MapCachingDialog from './features/map-caching/MapCachingDialog';
import CoordinateAveragingDialog from './features/measurement/CoordinateAveragingDialog';
import ParameterUploadSetupDialog from './features/parameters/ParameterUploadSetupDialog';
import SavedLocationEditorDialog from './features/saved-locations/SavedLocationEditorDialog';
import RTKSetupDialog from './features/rtk/RTKSetupDialog';
import Sidebar from './features/sidebar/Sidebar';
import ToastNotificationManager from './features/snackbar/ToastNotificationManager';
import UAVDetailsDialog from './features/uavs/UAVDetailsDialog';
import UploadDialog from './features/upload/UploadDialog';
import VersionCheckDialog from './features/version-check/VersionCheckDialog';

import { ErrorHandler } from './error-handling';
import flock, { Flock } from './flock';
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
import workbench, { perspectives } from './workbench';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';

require('../assets/css/proggy-vector.css');
require('../assets/css/kbd.css');
require('../assets/css/screen.less');
require('../assets/css/tooltips.less');

const Tour = loadable(() =>
  import(/* webpackChunkName: 'tour' */ './features/tour/Tour')
);

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
  width: '100%',
  height: '100%',
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
        <div style={rootInnerStyle}>
          <Sidebar workbench={workbench} />
          <WorkbenchView workbench={workbench} />
        </div>
        {config.ribbon && config.ribbon.label && (
          <CornerRibbon {...config.ribbon} />
        )}
        <PendingUAVIdOverlay />
      </div>

      <DetachedPanelManager />

      <ServerConnectionManager />

      <ShowFileWatcher />

      <dialogs.AppSettingsDialog />
      <dialogs.AuthenticationDialog />
      <dialogs.DeauthenticationDialog />
      <dialogs.FeatureEditorDialog />
      <dialogs.FlyToTargetDialog />
      <dialogs.GeofenceSettingsDialog />
      <dialogs.GlobalErrorDialog />
      <dialogs.LayerSettingsDialog />
      <dialogs.PromptDialog />
      <dialogs.ServerSettingsDialog />
      {hasTimeLimitedSession && <dialogs.SessionExpiryDialog />}
      <dialogs.TimeSyncDialog />

      <CoordinateAveragingDialog />
      <DockDetailsDialog />
      <HotkeyDialog />
      <LicenseInfoDialog />
      <MapCachingDialog />
      <ParameterUploadSetupDialog />
      <RTKSetupDialog />
      <SavedLocationEditorDialog />
      <UAVDetailsDialog />
      <UploadDialog />
      <VersionCheckDialog />

      <ToastProvider placement='top-center'>
        <ToastNotificationManager />
      </ToastProvider>

      {config.tour && <Tour />}
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
            <ThemeProvider>
              <Flock.Provider value={flock}>
                <Component {...this.props} />
              </Flock.Provider>
            </ThemeProvider>
          </StoreProvider>
        </ErrorBoundary>
      );
    }
  };

workbench.hoc = enhancer;
export default enhancer(App);
