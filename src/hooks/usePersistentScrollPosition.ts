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
  const scrollPosition = useRef(0);
  const onScroll = useCallback(
    (event: React.SyntheticEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      scrollPosition.current = (event.target as any).scrollTop;
    },
    [scrollPosition]
  );
  useLayoutEffect(() => {
    if (elementRef.current) {
      elementRef.current.scrollTop = scrollPosition.current;
    }
  });
  return [elementRef, onScroll];
}
