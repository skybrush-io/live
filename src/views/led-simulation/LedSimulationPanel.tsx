/**
 * @file LED show simulation panel.
 *
 * Plays back the show currently authored in the LED editor: a read-only grid of
 * drones (labelled Drone #1, #2, …, laid out in the active board's formation and
 * sized to fit the panel), a total-time scrub bar and a play/pause button. The
 * grid colours update from the shared playhead, so this stays in sync with the
 * editor timeline and the 3D view.
 */

import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Replay from '@mui/icons-material/Replay';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  getBoards,
  getDroneCount,
  getLedsPerDrone,
  getPlayheadSec,
  getPlaying,
  getTimelineDuration,
} from '~/features/led-editor/selectors';
import { setPlayhead, setPlaying } from '~/features/led-editor/slice';
import { computePlaybackFrame, rgbToCss } from '~/features/led-editor/utils';

const DRONE_GAP = 8;
const LABEL_HEIGHT = 14;
const MIN_CELL = 2;
const MAX_CELL = 22;

/** Track an element's content size with a ResizeObserver. */
const useElementSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setSize({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
};

const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
};

const LedSimulationPanel = (): JSX.Element => {
  const dispatch = useDispatch();
  const boards = useSelector(getBoards);
  const droneCount = useSelector(getDroneCount);
  const ledsPerDrone = useSelector(getLedsPerDrone);
  const playheadSec = useSelector(getPlayheadSec);
  const playing = useSelector(getPlaying);
  const duration = useSelector(getTimelineDuration);

  const [gridRef, gridSize] = useElementSize();

  const frame = useMemo(
    () => computePlaybackFrame(boards, droneCount, ledsPerDrone, playheadSec),
    [boards, droneCount, ledsPerDrone, playheadSec]
  );
  const { rows, cols } = frame;

  // Fit the drone grid to the available area.
  const cell = useMemo(() => {
    if (gridSize.width <= 0 || gridSize.height <= 0) {
      return 12;
    }
    const usableW = gridSize.width - (cols - 1) * DRONE_GAP - 8;
    const usableH =
      gridSize.height - rows * LABEL_HEIGHT - (rows - 1) * DRONE_GAP - 8;
    const byW = usableW / (cols * ledsPerDrone);
    const byH = usableH / (rows * ledsPerDrone);
    return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(Math.min(byW, byH))));
  }, [gridSize, rows, cols, ledsPerDrone]);

  const showLabels = cell >= 4;
  const hasShow = boards.length > 0 && duration > 0;

  const onPlayPause = () => {
    if (playing) {
      dispatch(setPlaying(false));
    } else {
      if (playheadSec >= duration) {
        dispatch(setPlayhead(0));
      }
      dispatch(setPlaying(true));
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Playback controls */}
      <Stack
        direction='row'
        spacing={1.5}
        alignItems='center'
        sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <IconButton
          size='small'
          color='primary'
          disabled={!hasShow}
          onClick={onPlayPause}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <Pause />
          ) : playheadSec >= duration && duration > 0 ? (
            <Replay />
          ) : (
            <PlayArrow />
          )}
        </IconButton>
        <Slider
          size='small'
          min={0}
          max={Math.max(duration, 0.001)}
          step={0.01}
          value={Math.min(playheadSec, duration)}
          disabled={!hasShow}
          onChange={(_event, value) =>
            dispatch(setPlayhead(value as number))
          }
          sx={{ flex: 1 }}
        />
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ minWidth: 96, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatTime(Math.min(playheadSec, duration))} / {formatTime(duration)}
        </Typography>
      </Stack>

      {/* Drone grid (read-only, fixed arrangement) */}
      <Box
        ref={gridRef}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          p: 1,
          backgroundColor: '#0c0c0c',
        }}
      >
        {!hasShow ? (
          <Typography variant='body2' color='text.secondary'>
            Create boards in the LED editor to simulate the show.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, max-content)`,
              gap: `${DRONE_GAP}px`,
            }}
          >
            {Array.from({ length: rows * cols }, (_unused, drone) => {
              const present = drone < droneCount;
              const dronePixels = frame.drones?.[drone];
              return (
                <Box
                  key={drone}
                  title={present ? `Drone #${drone + 1}` : undefined}
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${ledsPerDrone}, ${cell}px)`,
                      gridAutoRows: `${cell}px`,
                      gap: '1px',
                      opacity: present ? 1 : 0.12,
                    }}
                  >
                    {Array.from(
                      { length: ledsPerDrone * ledsPerDrone },
                      (_u, i) => {
                        const pixel = dronePixels?.[i] ?? [0, 0, 0];
                        const lit =
                          pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0;
                        return (
                          <Box
                            key={i}
                            sx={{
                              width: cell,
                              height: cell,
                              borderRadius: '50%',
                              background: lit ? rgbToCss(pixel) : '#1b1b1b',
                              boxShadow: lit
                                ? `0 0 ${Math.max(2, cell / 2)}px ${rgbToCss(pixel)}`
                                : 'none',
                            }}
                          />
                        );
                      }
                    )}
                  </Box>
                  {showLabels && present && (
                    <Typography
                      sx={{
                        fontSize: 9,
                        lineHeight: `${LABEL_HEIGHT}px`,
                        color: 'text.secondary',
                      }}
                    >
                      #{drone + 1}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LedSimulationPanel;
