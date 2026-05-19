import Add from '@mui/icons-material/Add';
import Remove from '@mui/icons-material/Remove';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';

import { makeStyles } from '@skybrush/app-theme-mui';

import LargeControlButtonGroup from './LargeControlButtonGroup';

const PANEL_WIDTH = 300;

const useStyles = makeStyles((theme) => ({
  root: {
    bottom: theme.spacing(2),
    pointerEvents: 'auto',
    position: 'fixed',
    right: theme.spacing(2),
    width: PANEL_WIDTH,
    zIndex: theme.zIndex.snackbar - 1,
  },

  panel: {
    overflow: 'hidden',
    width: PANEL_WIDTH,
  },

  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    minHeight: 28,
    padding: theme.spacing(0.25, 0.5, 0),
  },

  expandButton: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[8],

    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

const FloatingFlightCommandDeck = ({ t }) => {
  const classes = useStyles();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <Box className={classes.root}>
        <Tooltip title={t('largeControlButtonGroup.expandDeck')}>
          <IconButton
            aria-label={t('largeControlButtonGroup.expandDeck')}
            className={classes.expandButton}
            color='primary'
            onClick={() => setCollapsed(false)}
            size='large'
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box className={classes.root}>
      <Paper className={classes.panel} elevation={8}>
        <Box className={classes.header}>
          <Tooltip title={t('largeControlButtonGroup.collapseDeck')}>
            <IconButton
              aria-label={t('largeControlButtonGroup.collapseDeck')}
              onClick={() => setCollapsed(true)}
              size='small'
            >
              <Remove />
            </IconButton>
          </Tooltip>
        </Box>
        <LargeControlButtonGroup />
      </Paper>
    </Box>
  );
};

FloatingFlightCommandDeck.propTypes = {
  t: PropTypes.func,
};

export default withTranslation()(FloatingFlightCommandDeck);
