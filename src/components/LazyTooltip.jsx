import React, { useState } from 'react';
import Tippy from '@tippyjs/react';

import { useTheme } from '@material-ui/core/styles';

const LazyTooltip = (props) => {
  const appTheme = useTheme();
  const tippyTheme =
    appTheme.palette.type === 'dark' ? 'dark-border' : 'light-border';
  const [mounted, setMounted] = useState(false);

  const lazyPlugin = {
    fn: () => ({
      onShow: () => setMounted(true),
      onHidden: () => setMounted(false),
    }),
  };

  const computedProps = { ...props, theme: tippyTheme };

  computedProps.plugins = [lazyPlugin, ...(props.plugins || [])];

  if (props.render) {
    computedProps.render = (...args) => (mounted ? props.render(...args) : '');
  } else {
    computedProps.content = mounted ? props.content : '';
  }

  return <Tippy {...computedProps} />;
};

LazyTooltip.propTypes = Tippy.propTypes;

export default LazyTooltip;
