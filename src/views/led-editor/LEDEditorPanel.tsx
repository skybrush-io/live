/**
 * @file Top-level LED-show editor panel: a Premiere-style bulb-board editor
 * with a right-hand colour panel and a bottom timeline.
 *
 * Layout:
 *   ┌──────────────── arrangement controls ────────────────┐
 *   │ bulb grid (select bulbs)            │ colour panel    │
 *   └──────────────────────────────────────────────────────┘
 *   │ timeline (boards: move / trim / copy-paste)          │
 *
 * Copy/paste shortcuts are scoped to whichever region has focus (the grid for
 * bulb colours, the timeline for boards), so they never clobber global ones.
 */

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import React from 'react';

import ArrangementControls from './ArrangementControls';
import BoardGrid from './BoardGrid';
import ColorPanel from './ColorPanel';
import Timeline from './Timeline';

const LEDEditorPanel = (): JSX.Element => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ p: 1 }}>
      <ArrangementControls />
    </Box>

    <Divider />

    <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <BoardGrid />
      <ColorPanel />
    </Box>

    <Timeline />
  </Box>
);

export default LEDEditorPanel;
