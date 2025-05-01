import React, { useState } from 'react';

import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';

import { withStyles } from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import Mouse from '@material-ui/icons/Mouse';
import SelectAll from '@material-ui/icons/SelectAll';

const CATEGORIES = [
  {
    title: 'Navigation',
    icon: Mouse, // TODO: Maybe `PanTool` instead?
    hints: [
      { keys: ['Drag'], action: 'Pan' },
      { keys: ['Scroll'], action: 'Zoom' },
      { keys: ['Shift', 'Alt', 'Drag'], action: 'Rotate' },
    ],
  },
  {
    title: 'Selection',
    icon: SelectAll,
    hints: [
      { keys: ['Click'], action: 'Select' },
      { keys: ['Ctrl', 'Click'], action: 'Toggle selection' },
      { keys: ['Shift', 'Drag'], action: 'Box select' },
      { keys: ['Alt', 'Drag'], action: 'Box unselect' },
    ],
  },
  {
    title: 'Manipulation',
    icon: Edit,
    hints: [
      { keys: ['Drag'], action: 'Move selection' },
      { keys: ['Alt', 'Drag'], action: 'Rotate selection' },
    ],
  },
];

// HACK: Margin based alignment is just an overcomplicated hack,
//       it should probably be replaced with something cleaner...

const MiniTabs = withStyles((theme) => ({
  root: {
    minHeight: 0,
  },
  flexContainer: {
    gap: 16,
  },
  indicator: {
    height: 0,
    backgroundColor: 'transparent',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&::after': {
      content: '""',
      display: 'block',
      marginTop: '-4px',
      marginLeft: '24px',
      borderBottom: `1px solid ${theme.palette.text.secondary}`,
    },
  },
}))(Tabs);

const MiniTab = withStyles((theme) => ({
  root: {
    minHeight: 0,
    padding: 0,
  },
  wrapper: {
    flexDirection: 'row',
    gap: 4,
  },
  selected: {
    color: theme.palette.text.secondary,
  },
}))(Tab);

const InteractionHint = ({
  keys,
  action,
}: Readonly<{ keys: string[]; action: string }>): JSX.Element => (
  <span>
    {keys.map((k) => (
      <kbd key={k}>{k}</kbd>
    ))}{' '}
    <Typography component='span' variant='body2' color='textSecondary'>
      {action}
    </Typography>
  </span>
);

const InteractionHints = (): JSX.Element => {
  const [active, setActive] = useState(0);

  return (
    <Box height={50}>
      <MiniTabs value={active} style={{ marginBottom: 2 }}>
        {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
        {CATEGORIES.map(({ icon: Icon, title }, i) => (
          <MiniTab
            key={title}
            icon={<Icon fontSize='small' style={{ margin: 0 }} />}
            label={title}
            onMouseOver={() => {
              setActive(i);
            }}
          />
        ))}
      </MiniTabs>

      {CATEGORIES.map((c, i) => (
        <Fade key={c.title} in={active === i}>
          <Box position='absolute' display='flex' style={{ gap: 16 }}>
            {c.hints.map((h) => (
              <InteractionHint key={h.keys.join('+')} {...h} />
            ))}
          </Box>
        </Fade>
      ))}
    </Box>
  );
};

export default InteractionHints;
