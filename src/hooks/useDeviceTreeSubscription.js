import { useEffect } from 'react';
import useMessageHub from './useMessageHub';

/**
 * React hook that allows a functional component to subscribe to the value of a
 * given device tree path.
 */
export default function useDeviceTreeSubscription(path, callback) {
  const messageHub = useMessageHub();
  useEffect(() => {
    const unsubscribe = messageHub.subscribe(path, callback);
    return async () => {
      (await unsubscribe)();
    };
  }, [messageHub, path, callback]);
}
