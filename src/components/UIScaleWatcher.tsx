import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { getUIScale } from '~/features/settings/selectors';

/**
 * Component that applies the scale of the user interface whenever the
 * respective setting changes in the state. Does nothing when the application
 * is not running in Electron.
 */
const UIScaleWatcher = () => {
  const uiScale = useSelector(getUIScale);

  useEffect(() => {
    void window.bridge?.setUIScale(uiScale);
  }, [uiScale]);

  return null;
};

export default UIScaleWatcher;
