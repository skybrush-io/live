import { useInterval, useUpdate } from 'react-use';

function usePeriodicRefresh(ms) {
  const update = useUpdate();
  useInterval(update, ms);
}

export default usePeriodicRefresh;
