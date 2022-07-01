// Do not use @loadable/component here so we can put it in the vendors bundle
import React, { useState } from 'react';

import SplashScreen from './components/SplashScreen';

/**
 * Helper function that creates a React lazy-loaded component that also calls a
 * specified callback function when the component has finished loading. This is
 * used to trigger a transition of the splash screen so it fades out smoothly.
 */
const createAppComponent = ({ whenLoaded }) =>
  React.lazy(async () => {
    const App = await import(/* webpackChunkName: "workbench" */ './app');

    if (process.env.NODE_ENV !== 'production') {
      const { startReportingRuntimeErrors } = await import(
        /* webpackChunkName: "error-overlay" */ 'react-error-overlay'
      );
      startReportingRuntimeErrors({ onError() {} });
    }

    if (whenLoaded) {
      whenLoaded();
    }

    return App;
  });

const AppWithSplashScreen = () => {
  const [appLoading, setAppLoading] = useState(true);
  const [splashScreenVisible, setSplashScreenVisible] = useState(true);
  const App = React.useMemo(
    () =>
      createAppComponent({
        whenLoaded: () => setAppLoading(false),
      }),
    []
  );
  const onFirstRender = () => setSplashScreenVisible(false);

  return (
    <>
      <SplashScreen loading={appLoading} visible={splashScreenVisible} />
      <React.Suspense fallback={null}>
        <App onFirstRender={onFirstRender} />
      </React.Suspense>
    </>
  );
};

export default AppWithSplashScreen;
