// @ts-nocheck

import React, { useState } from 'react';

import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import { withStyles } from '@material-ui/core';

import { Edit, Mouse, SelectAll } from '@material-ui/icons';

const MiniTabs = withStyles({
  root: {
    minHeight: 0,
  },
  flexContainer: {
    gap: 16,
  },
  indicator: {
    display: 'none',
  },
})(Tabs);

const MiniTab = withStyles({
  root: {
    minHeight: 0,
    padding: 0,
  },
  wrapper: {
    flexDirection: 'row',
    gap: 4,
  },
})((props) => <Tab {...props} />);

const InteractionHint = ({
  keys,
  action,
}: Readonly<{ keys: string[]; action: string }>): JSX.Element => (
  <span>
    {keys.map((k) => (
      <kbd key={k}>{k}</kbd>
    ))}{' '}
    <span>{action}</span>
  </span>
);

const InteractionHints = (): JSX.Element => {
  const categories = [
    {
      title: 'Navigation',
      icon: Mouse, // Maybe `PanTool`?
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

  const [active, setActive] = useState(0);

  return (
    <Box height={48}>
      <MiniTabs value={active}>
        {categories.map(({ icon: Icon, title }, i) => (
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

      {categories.map((c, i) => (
        <Fade key={c.title} in={active === i}>
          <Box position='absolute' display='flex' sx={{ gap: 16 }}>
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
