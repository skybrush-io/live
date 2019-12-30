import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import React from 'react';
import { render } from 'react-dom';

import Application from './app';
import rootSaga from './sagas';
import { sagaMiddleware, waitUntilStateRestored } from './store';

// Const __PROD__ = process.env.NODE_ENV === 'production'
// const __DEV__ = !__PROD__

/* eslint-disable import/no-extraneous-dependencies */
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
/* eslint-enable import/no-extraneous-dependencies */

TimeAgo.addLocale(en);

// Spin up the root saga after the state has been restored
waitUntilStateRestored().then(() => {
  sagaMiddleware.run(rootSaga);
});

// Render the application
const root = document.querySelector('#root');
render(<Application />, root);
