import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/500.css';

import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import { createRoot } from 'react-dom/client';

import './i18n';
import AppWithSplashScreen from './splash';

// Disable React dev tools in production
if (process.env.NODE_ENV === 'production') {
  disableReactDevTools();
}

// Render the application
const container = document.querySelector('#root');
const root = createRoot(container);
root.render(<AppWithSplashScreen />);
