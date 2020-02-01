import { useState } from 'react';

export default () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const openMenu = event => setAnchorEl(event.currentTarget);
  const closeMenu = func => {
    if (typeof func === 'function') {
      return () => {
        func();
        closeMenu();
      };
    }

    setAnchorEl(null);
  };

  return [anchorEl, openMenu, closeMenu];
};
