import { useState } from 'react';

type EventHandler = (event: React.SyntheticEvent<HTMLElement>) => void;

export const useDropdown = (): [
  HTMLElement | null,
  EventHandler,
  EventHandler,
  (func: EventHandler | undefined) => EventHandler | undefined,
] => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const openMenu = (event: React.SyntheticEvent<HTMLElement>): void => {
    setAnchorElement(event.currentTarget);
  };

  const closeMenu = (): void => {
    setAnchorElement(null);
  };

  const closeMenuWith = (
    func: EventHandler | undefined
  ): EventHandler | undefined => {
    if (func) {
      return (event: React.SyntheticEvent<HTMLElement>): void => {
        func(event);
        closeMenu();
      };
    } else {
      return undefined;
    }
  };

  return [anchorElement, openMenu, closeMenu, closeMenuWith];
};

export default useDropdown;
