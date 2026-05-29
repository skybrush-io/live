import { useEffect } from 'react';
import useMessageHub from './useMessageHub';

/**
 * React hook that allows a functional component to subscribe to the value of a
 * given device tree path.
 */
export default function useDeviceTreeSubscription(
  path: string,
  callback: (value: unknown) => void
) {
  const messageHub = useMessageHub();
  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;

    void messageHub.subscribe(path, callback).then((disposer) => {
      if (isActive) {
        unsubscribe = disposer;
      } else {
        disposer();
      }
    });

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [messageHub, path, callback]);
}
