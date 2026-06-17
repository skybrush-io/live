/**
 * @file Top bar with the *global* show properties: LEDs-per-drone, drone count
 * and export FPS. The per-board formation (rows × cols) lives in the timeline
 * header instead, because it can differ from board to board.
 */

import Slideshow from '@mui/icons-material/Slideshow';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { openLedSimulator } from '~/features/led-editor/openSimulator';
import {
  getActiveGridDimensions,
  getDroneCount,
  getFps,
  getLedsPerDrone,
} from '~/features/led-editor/selectors';
import {
  setDroneCount,
  setFps,
  setLedsPerDrone,
} from '~/features/led-editor/slice';
import { type LedsPerDrone } from '~/features/led-editor/types';

import NumberField from './NumberField';

const ArrangementControls = (): JSX.Element => {
  const dispatch = useDispatch();
  const ledsPerDrone = useSelector(getLedsPerDrone);
  const droneCount = useSelector(getDroneCount);
  const fps = useSelector(getFps);
  const { width, height } = useSelector(getActiveGridDimensions);

  return (
    <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap'>
      <Stack spacing={0.25}>
        <Typography variant='caption' color='text.secondary'>
          LEDs / drone
        </Typography>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={ledsPerDrone}
          onChange={(_event, value: LedsPerDrone | null) => {
            if (value) {
              dispatch(setLedsPerDrone(value));
            }
          }}
        >
          <ToggleButton value={3}>3×3</ToggleButton>
          <ToggleButton value={4}>4×4</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <NumberField
        label='Drone count'
        value={droneCount}
        onCommit={(value) => dispatch(setDroneCount(value))}
      />
      <NumberField
        label='FPS'
        value={fps}
        onCommit={(value) => dispatch(setFps(value))}
      />

      <Button
        size='small'
        variant='outlined'
        startIcon={<Slideshow />}
        onClick={() => openLedSimulator()}
      >
        View in Simulator
      </Button>

      <Typography variant='caption' color='text.secondary'>
        Drones numbered left→right, top→bottom · each board sets its own
        formation · active canvas {width}×{height} px
      </Typography>
    </Stack>
  );
};

export default ArrangementControls;
