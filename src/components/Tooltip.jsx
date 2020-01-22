import React from 'react';
import Tippy from '@tippy.js/react';

import useDarkMode from '~/hooks/useDarkMode';

export default props => {
  const theme = useDarkMode() ? 'dark-border' : 'light-border';
  return <Tippy theme={theme} {...props} />;
};
