import delay from 'delay';
import CssBaseline from '@material-ui/core/CssBaseline';
import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { WorkbenchView } from 'react-flexible-workbench';
import { Provider as StoreProvider } from 'react-redux';
import { ToastProvider } from 'react-toast-notifications';
import { PersistGate } from 'redux-persist/es/integration/react';

import dialogs from './components/dialogs';
import Header from './components/header';
import HotkeyHandler from './components/HotkeyHandler';
import ServerConnectionManager from './components/ServerConnectionManager';
import SplashScreen from './components/SplashScreen';

import { ErrorHandler } from './error-handling';

import Sidebar from './features/sidebar/Sidebar';
import ToastNotificationManager from './features/snackbar/ToastNotificationManager';
import Tour from './features/tour/Tour';

import flock, { Flock } from './flock';
import hotkeys from './hotkeys';
import store, { persistor } from './store';
import ThemeProvider, { DarkModeExtraCSSProvider } from './theme';
import workbench from './workbench';

require('../assets/css/kbd.css');
require('../assets/css/screen.less');
require('../assets/css/tooltips.less');

require('react-cover-page/themes/default.css');
require('typeface-fira-sans');

const rootStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
};

const rootInnerStyle = {
  display: 'flex',
  flexGrow: 1,
  width: '100%',
  height: '100%',
};

/**
 * Helper function that restores the state of the workbench when it was loaded
 * back from the local storage during startup.
 */
const restoreWorkbench = (setShowSplashScreen) => async () => {
  const state = store.getState();
  if (state && state.workbench && state.workbench.state) {
    workbench.restoreState(state.workbench.state);
  }

  setShowSplashScreen(false);
  await delay(1000); // transition for the splash screen is ~300 msec
};

const App = () => {
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  // The loading sequence is as follows.
  //
  // First we start from showSplashScreen = true and loaded = false.
  // redux-persist starts restoring the state, and sets
  // showSplashScreen to false when the state is loaded. However, since
  // restoreWorkbench() includes an artificial delay, loaded does not
  // become true for an additional one second so we have time to make
  // the splash screen disappear before we unmount it.

  return (
    <PersistGate
      persistor={persistor}
      onBeforeLift={restoreWorkbench(setShowSplashScreen)}
    >
      {(loaded) => {
        return (
          <>
            {!loaded && <SplashScreen visible={showSplashScreen} />}
            {!showSplashScreen && (
              <>
                <CssBaseline />

                <HotkeyHandler hotkeys={hotkeys} />
                <DarkModeExtraCSSProvider />

                <div style={rootStyle}>
                  <Header workbench={workbench} />
                  <div style={rootInnerStyle}>
                    <Sidebar workbench={workbench} />
                    <WorkbenchView workbench={workbench} />
                  </div>
                </div>

                <ServerConnectionManager />

                <dialogs.AppSettingsDialog />
                <dialogs.AuthenticationDialog />
                <dialogs.DeauthenticationDialog />
                <dialogs.FeatureEditorDialog />
                <dialogs.GlobalErrorDialog />
                <dialogs.LayerSettingsDialog />
                <dialogs.MessagesDialog flock={flock} />
                <dialogs.PromptDialog />
                <dialogs.SavedLocationEditorDialog />
                <dialogs.ServerSettingsDialog />

                <ToastProvider placement='top-center'>
                  <ToastNotificationManager />
                </ToastProvider>

                <Tour />
              </>
            )}
          </>
        );
      }}
    </PersistGate>
  );
};

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

    render() {
      return (
        <ErrorBoundary FallbackComponent={ErrorHandler}>
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
