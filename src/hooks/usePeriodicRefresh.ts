import { useInterval, useUpdate } from 'react-use';

function usePeriodicRefresh(ms: number): void {
  const update = useUpdate();
  useInterval(update, ms);
}

export default usePeriodicRefresh;
