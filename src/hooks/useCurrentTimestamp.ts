import { useEffect, useState } from 'react';

/**
 * Hook that returns the current date as a UNIX timestamp, in a manner compatible with
 * the pureness of React components.
 *
 * This is achieved by storing the current date in a state variable and updating it
 * at given intervals.
 *
 * @param ms - The number of milliseconds to wait between updates. The default is
 *        one second. Set to zero to disable automatic updates.
 *
 * @returns The current date as a Date object.
 */
const useCurrentTimestamp = (ms = 1000) => {
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now);

  useEffect(() => {
    if (ms > 0) {
      const interval = setInterval(() => {
        setCurrentTimestamp(Date.now());
      }, ms);
      return () => {
        clearInterval(interval);
      };
    }
  }, [ms]);

  return currentTimestamp;
};

export default useCurrentTimestamp;
