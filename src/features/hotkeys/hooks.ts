import { useCallback } from 'react';

import useSignal from '~/hooks/useSignal';

import keyboardNavigationSignal from './signal';
import type { KeyboardNavigationHandlers } from './navigation';

export function useKeyboardNavigation(
  handlers: KeyboardNavigationHandlers<any>
): void {
  const signalHandler = useCallback(
    (action: keyof KeyboardNavigationHandlers, event: KeyboardEvent) => {
      const handler = handlers[action];
      if (handler) {
        handler(event);
      }
    },
    [handlers]
  );

  useSignal(keyboardNavigationSignal, signalHandler);
}
