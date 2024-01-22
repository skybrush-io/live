import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'react-redux';
import { useInterval } from 'react-use';

export const usePeriodicSelector = (selector, interval) => {
  const store = useStore();
  const [value, setValue] = useState(() => selector(store.getState()));

  const callback = useCallback(() => {
    setValue(selector(store.getState()));
  }, [selector, setValue, store]);

  useInterval(callback, interval);
  useEffect(callback, [callback]);

  return value;
};
