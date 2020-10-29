import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import React from 'react';
import { render } from 'react-dom';

import { disableReactDevTools } from '@fvilers/disable-react-devtools';

import Application from './app';
import rootSaga from './sagas';
import { sagaMiddleware, waitUntilStateRestored } from './store';

/* eslint-disable import/no-extraneous-dependencies */
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
/* eslint-enable import/no-extraneous-dependencies */

// Disable React dev tools in production
if (process.env.NODE_ENV === 'production') {
  disableReactDevTools();
}

// Configure TimeAgo
TimeAgo.addLocale(en);

// Spin up the root saga after the state has been restored.
waitUntilStateRestored().then(() => {
  sagaMiddleware.run(rootSaga);
});

// Render the application
const root = document.querySelector('#root');
render(<Application />, root);
