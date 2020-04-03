import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import { WorkbenchView } from 'react-flexible-workbench';
import { Provider as StoreProvider } from 'react-redux';
import { ToastProvider } from 'react-toast-notifications';
import compose from 'recompose/compose';
import setDisplayName from 'recompose/setDisplayName';
import toClass from 'recompose/toClass';
import withProps from 'recompose/withProps';
import { PersistGate } from 'redux-persist/es/integration/react';

import dialogs from './components/dialogs';
import Header from './components/header';
import HotkeyHandler from './components/HotkeyHandler';
import ServerConnectionManager from './components/ServerConnectionManager';
import SplashScreen from './components/SplashScreen';

import Sidebar from './features/sidebar/Sidebar';
import ToastNotificationManager from './features/snackbar/ToastNotificationManager';

import flock, { Flock } from './flock';
import { withErrorBoundary, wrapWith } from './hoc';
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
  height: '100%'
};

const rootInnerStyle = {
  display: 'flex',
  flexGrow: 1,
  width: '100%',
  height: '100%'
};

/**
 * Helper function that restores the state of the workbench when it was loaded
 * back from the local storage during startup.
 */
const restoreWorkbench = () => {
  const state = store.getState();
  if (state && state.workbench && state.workbench.state) {
    workbench.restoreState(state.workbench.state);
  }
};

const App = () => (
  <PersistGate
    persistor={persistor}
    loading={<SplashScreen />}
    onBeforeLift={restoreWorkbench}
  >
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

    <ToastProvider placement="top-center">
      <ToastNotificationManager />
    </ToastProvider>
  </PersistGate>
);

/**
 * The context provider for the main application component and the
 * individual application panels.
 */
const enhancer = compose(
  setDisplayName('WorkbenchRoot'), // to have short names in the React profiler
  toClass, // react-flexible-workbench likes class components at the top
  withErrorBoundary,
  wrapWith(withProps({ store })(StoreProvider)),
  wrapWith(ThemeProvider),
  wrapWith(withProps({ value: flock })(Flock.Provider))
);

workbench.hoc = enhancer;
export default enhancer(App);
