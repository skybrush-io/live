import React from 'react';
import Tippy from '@tippyjs/react';

import { useTheme } from '@material-ui/core/styles';

const Tooltip = (props) => {
  const appTheme = useTheme();
  const tippyTheme =
    appTheme.palette.type === 'dark' ? 'dark-border' : 'light-border';
  return <Tippy theme={tippyTheme} {...props} />;
};

export default Tooltip;
