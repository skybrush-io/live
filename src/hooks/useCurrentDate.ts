import { useEffect, useState } from 'react';

/**
 * Hook that returns the current date as a Date object, in a manner compatible with
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
const useCurrentDate = (ms = 1000) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    if (ms > 0) {
      const interval = setInterval(() => {
        setCurrentDate(new Date());
      }, ms);
      return () => {
        clearInterval(interval);
      };
    }
  }, [ms]);

  return currentDate;
};

export default useCurrentDate;
