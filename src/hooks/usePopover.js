import { useState } from 'react';

const usePopover = () => {
  const [anchor, setAnchor] = useState(null);

  const open = (event) => {
    setAnchor(event.currentTarget);
  };

  const close = () => {
    setAnchor(null);
  };

  return [anchor, open, close];
};

export default usePopover;
