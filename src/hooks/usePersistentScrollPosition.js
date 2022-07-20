import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * React hook that allows a functional component to keep the scroll position of
 * an element consistent.
 */
export default function usePersistentScrollPosition() {
  const elementRef = useRef(null);
  const scrollPosition = useRef(0);
  const onScroll = useCallback(
    (e) => {
      scrollPosition.current = e.target.scrollTop;
    },
    [scrollPosition]
  );
  useLayoutEffect(() => {
    elementRef.current.scrollTop = scrollPosition.current;
  });
  return [elementRef, onScroll];
}
