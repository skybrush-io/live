import { useMemo } from 'react';
import { useStore } from 'react-redux';

import type { AppSelector, RootState } from '~/store/reducers';

const useSelectorOnce = <T>(selector: AppSelector<T>): T => {
  const store = useStore<RootState>();
  return useMemo(() => selector(store.getState()), [selector, store]);
};

export default useSelectorOnce;
