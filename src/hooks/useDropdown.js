import { useState } from 'react';

export default () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = event => setAnchorEl(event.currentTarget);
  const closeMenu = (...args) => {
    if (args.length > 0) {
      if (typeof args[0] === 'function') {
        return () => {
          args[0]();
          closeMenu();
        };
      }

      if (args[0] === undefined) {
        return undefined;
      }
    }

    setAnchorEl(null);
  };

  return [anchorEl, openMenu, closeMenu];
};
