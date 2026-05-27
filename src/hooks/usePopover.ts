import { useState } from 'react';

type PopoverHookProps<T extends HTMLElement> = [
  T | null,
  (event: { currentTarget: T }) => void,
  () => void,
];

const usePopover = <T extends HTMLElement>(): PopoverHookProps<T> => {
  const [anchor, setAnchor] = useState<T | null>(null);

  const open = (event: { currentTarget: T }) => {
    setAnchor(event.currentTarget);
  };

  const close = () => {
    setAnchor(null);
  };

  return [anchor, open, close];
};

export default usePopover;
