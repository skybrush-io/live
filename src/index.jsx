import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import React from 'react';
import { render } from 'react-dom';

import Application from './app';
import rootSaga from './sagas';
import { sagaMiddleware, loadStoreFromStorageBackend } from './store';
import workbench from './workbench';

// Const __PROD__ = process.env.NODE_ENV === 'production'
// const __DEV__ = !__PROD__

/* eslint-disable import/no-extraneous-dependencies */
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
/* eslint-enable import/no-extraneous-dependencies */

async function initialize() {
  TimeAgo.addLocale(en);

  // Spin up the root saga
  sagaMiddleware.run(rootSaga);

  // Restore the state of the application
  const state = await loadStoreFromStorageBackend();
  if (state && state.workbench && state.workbench.state) {
    workbench.restoreState(state.workbench.state);
  }
}

function renderApplication() {
  const root = document.querySelector('#root');
  return render(<Application />, root);
}

initialize().then(renderApplication);
