/**
 * @file Always-mounted, invisible driver that advances the LED show's shared
 * playhead in real time while it is playing.
 *
 * Mounted once at the app root so playback keeps running regardless of which
 * panels are open — the timeline scrubber, the 2D simulator and the 3D view all
 * read the same `playheadSec` from the store.
 */

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import store from '~/store';

import { getPlayheadSec, getPlaying, getTimelineDuration } from './selectors';
import { setPlayhead, setPlaying } from './slice';

const LedPlaybackDriver = (): null => {
  const dispatch = useDispatch();
  const playing = useSelector(getPlaying);
  const duration = useSelector(getTimelineDuration);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    if (duration <= 0) {
      dispatch(setPlaying(false));
      return undefined;
    }

    let raf = 0;
    lastRef.current = performance.now();
    const tick = (now: number): void => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      const next = getPlayheadSec(store.getState()) + dt;
      if (next >= duration) {
        dispatch(setPlayhead(duration));
        dispatch(setPlaying(false)); // stop at the end
        return;
      }
      dispatch(setPlayhead(next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, dispatch]);

  return null;
};

export default LedPlaybackDriver;
