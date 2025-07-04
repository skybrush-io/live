import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';

import { withStyles } from '@material-ui/core';

import Edit from '@material-ui/icons/Edit';
import Mouse from '@material-ui/icons/Mouse';
import SelectAll from '@material-ui/icons/SelectAll';

import { tt } from '~/i18n';

// TODO: Make a factory function for `tt` that is smart enough to support
//       `keyPrefix` and still compatible with `babel-plugin-i18n-extract`
const CATEGORIES = [
  {
    title: tt('show.showConfigurator.interactionHints.category.navigation'),
    icon: Mouse, // TODO: Maybe `PanTool` instead?
    hints: [
      {
        keys: ['Drag'],
        action: tt('show.showConfigurator.interactionHints.action.pan'),
      },
      {
        keys: ['Scroll'],
        action: tt('show.showConfigurator.interactionHints.action.zoom'),
      },
      {
        keys: ['Shift', 'Alt', 'Drag'],
        action: tt('show.showConfigurator.interactionHints.action.rotate'),
      },
    ],
  },
  {
    title: tt('show.showConfigurator.interactionHints.category.selection'),
    icon: SelectAll,
    hints: [
      {
        keys: ['Click'],
        action: tt('show.showConfigurator.interactionHints.action.select'),
      },
      {
        keys: ['Ctrl', 'Click'],
        action: tt(
          'show.showConfigurator.interactionHints.action.toggleSelect'
        ),
      },
      {
        keys: ['Shift', 'Drag'],
        action: tt('show.showConfigurator.interactionHints.action.boxSelect'),
      },
      {
        keys: ['Alt', 'Drag'],
        action: tt('show.showConfigurator.interactionHints.action.boxUnselect'),
      },
    ],
  },
  {
    title: tt('show.showConfigurator.interactionHints.category.manipulation'),
    icon: Edit,
    hints: [
      {
        keys: ['Drag'],
        action: tt(
          'show.showConfigurator.interactionHints.action.moveSelection'
        ),
      },
      {
        keys: ['Alt', 'Drag'],
        action: tt(
          'show.showConfigurator.interactionHints.action.rotateSelection'
        ),
      },
    ],
  },
];

// HACK: Margin based alignment is just an overcomplicated hack,
//       it should probably be replaced with something cleaner...

const MiniTabs = withStyles((theme) => ({
  root: {
    minHeight: 0,
    color: theme.palette.text.primary,
    marginTop: -theme.spacing(0.25),
    paddingBottom: theme.spacing(0.5),
  },
  flexContainer: {
    gap: theme.spacing(2),
  },
  indicator: {
    height: 0,
    backgroundColor: 'transparent',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&::after': {
      content: '""',
      display: 'block',
      marginTop: -theme.spacing(0.5),
      marginLeft: theme.spacing(3),
      borderBottom: `2px solid ${theme.palette.text.secondary}`,
    },
  },
}))(Tabs);

const MiniTab = withStyles({
  root: {
    minHeight: 0,
    padding: 0,
    opacity: 1,
  },
  wrapper: {
    flexDirection: 'row',
    gap: 4,
  },
  selected: {
    background: 'gradient(linear, 0deg, #0000 0%, #f000 100%)',
  },
})(Tab);

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
  const { t } = useTranslation();
  const [active, setActive] = useState(0);

  return (
    <Box height={50}>
      <MiniTabs value={active} style={{ marginBottom: 2 }}>
        {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
        {CATEGORIES.map(({ icon: Icon, title }, i) => (
          <MiniTab
            key={title(t)}
            icon={<Icon fontSize='small' style={{ margin: 0 }} />}
            label={title(t)}
            onMouseOver={() => {
              setActive(i);
            }}
          />
        ))}
      </MiniTabs>

      {CATEGORIES.map((c, i) => (
        <Fade key={c.title(t)} in={active === i}>
          <Box position='absolute' display='flex' style={{ gap: 16 }}>
            {c.hints.map((h) => (
              <InteractionHint
                key={h.keys.join('+')}
                keys={h.keys}
                action={h.action(t)}
              />
            ))}
          </Box>
        </Fade>
      ))}
    </Box>
  );
};

export default InteractionHints;
