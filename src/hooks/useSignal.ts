import type { MiniSignal } from 'mini-signals';
import { useEffect } from 'react';

export type SignalCallback<T extends any[]> = (...x: T) => void;

/**
 * React hook that allows a functional component to register a callback to a
 * signal while it is mounted.
 */
function useSignal<T extends any[]>(
  signal: MiniSignal,
  callback: SignalCallback<T>
): void {
  useEffect(() => {
    const binding = signal.add(callback);
    return (): void => {
      signal.detach(binding);
    };
  }, [signal, callback]);
}

export default useSignal;
