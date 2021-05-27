import { useCallback } from 'react';

import useSignal from '~/hooks/useSignal';

import hotkeySignal from './signal';

export function useKeyboardNavigation(handlers) {
  const signalHandler = useCallback(
    (action, event) => {
      const handler = handlers[action];
      if (handler) {
        handler(event);
      }
    },
    [handlers]
  );

  useSignal(hotkeySignal, signalHandler);
}
