import useEffect from 'react';

/**
 * Hook that ties a React component to the lifecycle of a Flock_ model object.
 */
export function useFlock(
  flock,
  { onUAVsAdded, onUAVsRemoved, onUAVsUpdated } = {}
) {
  useEffect(() => {
    if (onUAVsAdded) {
      flock.uavsAdded.add(onUAVsAdded);
    }

    if (onUAVsRemoved) {
      flock.uavsRemoved.add(onUAVsRemoved);
    }

    if (onUAVsUpdated) {
      flock.uavsUpdated.add(onUAVsUpdated);
    }

    return () => {
      if (onUAVsAdded) {
        flock.uavsAdded.detach(onUAVsAdded);
      }

      if (onUAVsRemoved) {
        flock.uavsRemoved.detach(onUAVsRemoved);
      }

      if (onUAVsUpdated) {
        flock.uavsUpdated.detach(onUAVsUpdated);
      }
    };
  }, [flock, onUAVsAdded, onUAVsRemoved, onUAVsUpdated]);
}

export default useFlock;
