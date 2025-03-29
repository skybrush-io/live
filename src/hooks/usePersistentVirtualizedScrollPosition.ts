import { useCallback, useRef } from 'react';
import type {
  StateSnapshot,
  VirtuosoHandle,
  VirtuosoProps,
} from 'react-virtuoso';

/**
 * React hook that allows a <code>react-virtuoso</code> component to keep the
 * scroll position consistent even when it is re-rendered.
 */
export default function usePersistentVirtualizedScrollPosition(): Pick<
  VirtuosoProps<any, any>,
  'restoreStateFrom' | 'onScroll'
> & { ref: React.RefObject<VirtuosoHandle> } {
  const ref = useRef<VirtuosoHandle>(null);
  const state = useRef<StateSnapshot | undefined>(undefined);

  const onScroll = useCallback(() => {
    ref.current?.getState((snapshot) => {
      state.current = snapshot;
    });
  }, []);

  return { ref, onScroll, restoreStateFrom: state.current };
}
