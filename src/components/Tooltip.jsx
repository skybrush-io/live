import React from 'react';
import Tippy from '@tippy.js/react';

import { useTheme } from '@material-ui/core/styles';

export default props => {
  const appTheme = useTheme();
  const tippyTheme =
    appTheme.palette.type === 'dark' ? 'dark-border' : 'light-border';
  return <Tippy theme={tippyTheme} {...props} />;
};
