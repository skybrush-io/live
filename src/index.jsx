import '@fontsource/fira-sans/latin.css';
import '@fontsource/fira-sans/latin-ext.css';
import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import React from 'react';
import { render } from 'react-dom';

import './i18n';
import AppWithSplashScreen from './splash';

// Disable React dev tools in production
if (process.env.NODE_ENV === 'production') {
  disableReactDevTools();
}

// Render the application
const root = document.querySelector('#root');
render(<AppWithSplashScreen />, root);
