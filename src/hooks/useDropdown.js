import { useState } from 'react';

export default () => {
  const [anchorElement, setAnchorElement] = useState(null);

  const openMenu = (event) => setAnchorElement(event.currentTarget);
  const closeMenu = (...args) => {
    if (args.length > 0) {
      if (typeof args[0] === 'function') {
        return (event) => {
          args[0](event);
          closeMenu();
        };
      }

      if (args[0] === undefined) {
        return undefined;
      }
    }

    setAnchorElement(null);
  };

  return [anchorElement, openMenu, closeMenu];
};
