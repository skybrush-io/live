import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider } from '@material-ui/core/styles';
import React from 'react';
import { WorkbenchView } from 'react-flexible-workbench';
import { Provider as StoreProvider } from 'react-redux';
import compose from 'recompose/compose';
import toClass from 'recompose/toClass';
import withProps from 'recompose/withProps';
import { PersistGate } from 'redux-persist/es/integration/react';

import dialogs from './components/dialogs';
import Header from './components/header';
import Sidebar from './components/sidebar';
import HotkeyHandler from './components/HotkeyHandler';
import ServerConnectionManager from './components/ServerConnectionManager';
import SplashScreen from './components/SplashScreen';

import GlobalSnackbar from './features/snackbar/GlobalSnackbar';

import flock, { Flock } from './flock';
import { withErrorBoundary, wrapWith } from './hoc';
import hotkeys from './hotkeys';
import store, { persistor } from './store';
import theme from './theme';
import workbench from './workbench';

require('../assets/css/screen.less');
require('../assets/css/chat.less');
require('../assets/css/kbd.css');

require('react-cover-page/themes/default.css');
require('typeface-roboto');

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

const Application = () => (
  <PersistGate
    persistor={persistor}
    loading={<SplashScreen />}
    onBeforeLift={restoreWorkbench}
  >
    <CssBaseline />

    <HotkeyHandler hotkeys={hotkeys} />

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

    <GlobalSnackbar />
  </PersistGate>
);

/**
 * The context provider for the main application component and the
 * individual application panels.
 */
const enhancer = compose(
  toClass, // react-flexible-workbench likes class components at the top
  withErrorBoundary,
  wrapWith(withProps({ theme })(MuiThemeProvider)),
  wrapWith(withProps({ store })(StoreProvider)),
  wrapWith(withProps({ value: flock })(Flock.Provider))
);

workbench.hoc = enhancer;
export default enhancer(Application);
