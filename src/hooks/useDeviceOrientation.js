import { useEffect, useState } from 'react';

/**
 * React hook that allows a functional component to make use of relative or
 * absolute device orientation information.
 */
export default function useDeviceOrientation({ absolute = false } = {}) {
  const [orientation, setOrientation] = useState(null);

  useEffect(() => {
    const event = absolute ? 'deviceorientationabsolute' : 'deviceorientation';

    window.addEventListener(event, setOrientation);
    return () => {
      window.removeEventListener(event, setOrientation);
    };
  }, [absolute]);

  return orientation;
}
