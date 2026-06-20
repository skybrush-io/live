import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'react-redux';
import { useInterval } from 'react-use';
import type { RootState } from '~/store/reducers';

export const usePeriodicSelector = <T>(
  selector: (state: RootState) => T,
  interval: number
): T => {
  const store = useStore<RootState>();
  const [value, setValue] = useState(() => selector(store.getState()));

  const callback = useCallback(() => {
    // ESLint warning disabled because this is not an effect but a callback that will be
    // called periodically by useInterval().
    //
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setValue(selector(store.getState()));
  }, [selector, setValue, store]);

  useInterval(callback, interval);
  useEffect(callback, [callback]);

  return value;
};

export default usePeriodicSelector;
