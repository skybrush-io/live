/**
 * @file Right-hand colour panel. Activated by selecting bulbs in the grid;
 * applies a colour to the current selection (live, plus an explicit button) and
 * exposes copy/paste of bulb colours.
 */

import ContentCopy from '@mui/icons-material/ContentCopy';
import ContentPaste from '@mui/icons-material/ContentPaste';
import FormatColorFill from '@mui/icons-material/FormatColorFill';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  getActiveArrangement,
  getActiveBoard,
  getActiveColor,
  getActiveGridDimensions,
  getClipboard,
  getLedsPerDrone,
  getSelectedPixels,
} from '~/features/led-editor/selectors';
import {
  copySelection,
  paintPixels,
  pasteClipboard,
  setActiveColor,
} from '~/features/led-editor/slice';
import { type RGB } from '~/features/led-editor/types';
import {
  clampChannel,
  droneIndexForPixel,
  hexToRgb,
  rgbToHex,
} from '~/features/led-editor/utils';

const ColorPanel = (): JSX.Element => {
  const dispatch = useDispatch();
  const board = useSelector(getActiveBoard);
  const activeColor = useSelector(getActiveColor);
  const selectedPixels = useSelector(getSelectedPixels);
  const clipboard = useSelector(getClipboard);
  const { width } = useSelector(getActiveGridDimensions);
  const ledsPerDrone = useSelector(getLedsPerDrone);
  const { cols } = useSelector(getActiveArrangement);

  const hasSelection = selectedPixels.length > 0;

  // Apply a colour both to the active swatch and (live) to the selection.
  const applyColor = (color: RGB) => {
    dispatch(setActiveColor(color));
    if (board && selectedPixels.length > 0) {
      dispatch(paintPixels({ indices: selectedPixels, color }));
    }
  };

  const setChannel = (channel: 0 | 1 | 2, value: number) => {
    const next: RGB = [...activeColor];
    next[channel] = clampChannel(value);
    applyColor(next);
  };

  // If the whole selection belongs to one drone, name it.
  const droneLabel = (() => {
    if (selectedPixels.length === 0) {
      return undefined;
    }
    const drones = new Set(
      selectedPixels.map((index) =>
        droneIndexForPixel(index, width, ledsPerDrone, cols)
      )
    );
    return drones.size === 1
      ? `Drone #${[...drones][0]! + 1}`
      : `${drones.size} drones`;
  })();

  return (
    <Box
      sx={{
        width: 232,
        flex: '0 0 auto',
        height: '100%',
        overflow: 'auto',
        borderLeft: '1px solid',
        borderColor: 'divider',
        p: 1.5,
      }}
    >
      <Typography variant='subtitle2' gutterBottom>
        Colour
      </Typography>

      <Typography variant='caption' color='text.secondary'>
        {hasSelection
          ? `${selectedPixels.length} bulb(s) selected · ${droneLabel}`
          : 'Click bulbs in the grid to select, then pick a colour.'}
      </Typography>

      <Box
        component='input'
        type='color'
        value={rgbToHex(activeColor)}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          applyColor(hexToRgb(event.target.value))
        }
        sx={{
          display: 'block',
          width: '100%',
          height: 56,
          mt: 1.5,
          p: 0,
          border: '1px solid #555',
          borderRadius: 1,
          background: 'none',
          cursor: 'pointer',
        }}
      />

      <Stack direction='row' spacing={1} sx={{ mt: 1.5 }}>
        {(['R', 'G', 'B'] as const).map((label, channel) => (
          <TextField
            key={label}
            size='small'
            type='number'
            label={label}
            value={activeColor[channel as 0 | 1 | 2]}
            onChange={(event) =>
              setChannel(channel as 0 | 1 | 2, Number(event.target.value))
            }
            slotProps={{
              htmlInput: { min: 0, max: 255 },
              inputLabel: { shrink: true },
            }}
          />
        ))}
      </Stack>

      <Button
        fullWidth
        variant='contained'
        size='small'
        startIcon={<FormatColorFill />}
        disabled={!board || !hasSelection}
        sx={{ mt: 1.5 }}
        onClick={() =>
          dispatch(paintPixels({ indices: selectedPixels, color: activeColor }))
        }
      >
        Apply to selection
      </Button>

      <Divider sx={{ my: 1.5 }} />

      <Stack direction='row' spacing={1}>
        <Button
          fullWidth
          size='small'
          variant='outlined'
          startIcon={<ContentCopy />}
          disabled={!board || !hasSelection}
          onClick={() => dispatch(copySelection())}
        >
          Copy
        </Button>
        <Button
          fullWidth
          size='small'
          variant='outlined'
          startIcon={<ContentPaste />}
          disabled={!board || !clipboard}
          onClick={() => dispatch(pasteClipboard(undefined))}
        >
          Paste
        </Button>
      </Stack>
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ display: 'block', mt: 1 }}
      >
        Ctrl+click to multi-select · Shift+click for a range · Ctrl+A to select
        all · Ctrl+C / Ctrl+V to copy / paste colours (paste fills the whole
        selection).
      </Typography>
    </Box>
  );
};

export default ColorPanel;
