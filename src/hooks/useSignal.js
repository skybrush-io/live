import { useEffect } from 'react';

/**
 * React hook that allows a functional component to register a callback to a
 * signal while it is mounted.
 */
function useSignal(signal, callback) {
  useEffect(() => {
    const binding = signal.add(callback);
    return () => {
      signal.detach(binding);
    };
  }, [signal, callback]);
}

export default useSignal;
