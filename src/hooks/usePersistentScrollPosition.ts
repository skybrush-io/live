import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * React hook that allows a functional component to keep the scroll position of
 * an element consistent.
 */
export default function usePersistentScrollPosition(): [
  RefObject<HTMLDivElement | undefined>,
  (event: React.SyntheticEvent) => void,
] {
  const elementRef = useRef<HTMLDivElement>();
  const scrollPositionRef = useRef(0);
  const onScroll = useCallback(
    (event: React.SyntheticEvent) => {
      scrollPositionRef.current = (event.target as any).scrollTop;
    },
    [scrollPositionRef]
  );
  useLayoutEffect(() => {
    if (elementRef.current) {
      elementRef.current.scrollTop = scrollPositionRef.current;
    }
  });
  return [elementRef, onScroll];
}
