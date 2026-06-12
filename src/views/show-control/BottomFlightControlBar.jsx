import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@skybrush/app-theme-mui';

import FlightCommandTargetToggle from './FlightCommandTargetToggle';
import LargeControlButtonGroup from './LargeControlButtonGroup';
import MissionSetupStrip from './MissionSetupStrip';
import PreflightStartStrip from './PreflightStartStrip';
import ShowControlDialogs from './ShowControlDialogs';

const COLLAPSED_STORAGE_KEY = 'skybrush:bottomFlightControlBarCollapsed';

const readCollapsedPreference = () => {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const useStyles = makeStyles((theme) => ({
  shell: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: '100%',
  },
  root: {
    backgroundColor: '#12151a',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 -8px 28px rgba(0, 0, 0, 0.45)',
    boxSizing: 'border-box',
    maxHeight: 'calc(100vh - 52px)',
    overflowX: 'hidden',
    overflowY: 'auto',
    padding: theme.spacing(2.75, 1.25, 1, 1.25),
    pointerEvents: 'auto',
    position: 'relative',
    width: '100%',
  },
  panelGrid: {
    alignItems: 'stretch',
    display: 'grid',
    gap: theme.spacing(1),
    gridAutoRows: 'auto',
    gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1.35fr) minmax(0, 0.95fr)',

    [theme.breakpoints.down('xl')]: {
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 0.9fr)',
    },

    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  collapsedBar: {
    alignItems: 'center',
    backgroundColor: '#12151a',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.4)',
    boxSizing: 'border-box',
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'center',
    minHeight: 36,
    padding: theme.spacing(0.375, 1.25),
    pointerEvents: 'auto',
    width: '100%',
  },
  collapsedLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.76rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  collapseToggle: {
    color: 'rgba(255,255,255,0.72)',

    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
  },
  collapseToggleExpanded: {
    position: 'absolute',
    right: theme.spacing(0.75),
    top: theme.spacing(0.375),
    zIndex: 2,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'visible',
  },
  dronePanel: {
    minWidth: 0,
  },
  missionPanel: {
    minWidth: 0,
  },
  preflightPanel: {
    minWidth: 0,
  },
  panelHeader: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: theme.spacing(0.75),
    justifyContent: 'space-between',
    minHeight: 28,
    padding: theme.spacing(0.625, 1.25, 0.375),
  },
  panelTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 'clamp(0.72rem, 0.88vw, 0.78rem)',
    fontWeight: 700,
    letterSpacing: '0.14em',
    lineHeight: 1,
    textTransform: 'uppercase',
  },
}));

const BottomFlightControlBar = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  }, []);

  return (
    <>
      <Box className={classes.shell}>
        {collapsed ? (
          <Box className={classes.collapsedBar}>
            <Typography className={classes.collapsedLabel} component='span'>
              {t('bottomBar.flightControls')}
            </Typography>
            <Tooltip title={t('bottomBar.expand')}>
              <IconButton
                aria-label={t('bottomBar.expand')}
                className={classes.collapseToggle}
                onClick={toggleCollapsed}
                size='small'
              >
                <ExpandLess fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box className={classes.root}>
            <Tooltip title={t('bottomBar.collapse')}>
              <IconButton
                aria-label={t('bottomBar.collapse')}
                className={`${classes.collapseToggle} ${classes.collapseToggleExpanded}`}
                onClick={toggleCollapsed}
                size='small'
              >
                <ExpandMore fontSize='small' />
              </IconButton>
            </Tooltip>

            <Box className={classes.panelGrid}>
              <Box className={`${classes.panel} ${classes.dronePanel}`}>
                <Box className={classes.panelHeader}>
                  <Typography className={classes.panelTitle} component='div'>
                    {t('bottomBar.droneControl')}
                  </Typography>
                  <FlightCommandTargetToggle />
                </Box>
                <LargeControlButtonGroup variant='bottomBar' />
              </Box>

              <Box className={`${classes.panel} ${classes.missionPanel}`}>
                <MissionSetupStrip />
              </Box>

              <Box className={`${classes.panel} ${classes.preflightPanel}`}>
                <Box className={classes.panelHeader}>
                  <Typography className={classes.panelTitle} component='div'>
                    {t('bottomBar.preflightCheck')}
                  </Typography>
                </Box>
                <PreflightStartStrip />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <ShowControlDialogs />
    </>
  );
};

export default BottomFlightControlBar;
