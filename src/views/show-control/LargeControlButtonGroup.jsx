import AdsClick from '@mui/icons-material/AdsClick';
import Cast from '@mui/icons-material/Cast';
import Clear from '@mui/icons-material/Clear';
import PositionHold from '@mui/icons-material/Flag';
import FlightLand from '@mui/icons-material/FlightLand';
import Home from '@mui/icons-material/Home';
import PlayArrow from '@mui/icons-material/PlayArrow';
import PowerSettingsNew from '@mui/icons-material/PowerSettingsNew';
import RocketLaunch from '@mui/icons-material/RocketLaunch';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { deepPurple } from '@mui/material/colors';
import { bindActionCreators } from '@reduxjs/toolkit';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import ColoredButton from '~/components/ColoredButton';
import Colors from '~/components/colors';
import {
  areFlightCommandsBroadcast,
  getPreferredCommunicationChannelIndex,
  getUAVIdsParticipatingInMission,
} from '~/features/mission/selectors';
import { setCommandsAreBroadcast } from '~/features/mission/slice';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import { createUAVOperationThunks } from '~/utils/messaging';

const useStyles = makeStyles((theme) => ({
  commandDeck: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(0, 1.25, 1.25),
  },

  modeHint: {
    color: theme.palette.text.secondary,
    letterSpacing: '0.01em',
    lineHeight: 1.3,
    minHeight: '2.6em',
    textAlign: 'center',
  },

  modeToggle: {
    width: '100%',

    '& .MuiToggleButton-root': {
      flex: 1,
      gap: theme.spacing(0.5),
      letterSpacing: '0.02em',
      lineHeight: 1.2,
      padding: theme.spacing(0.75, 0.5),
      textTransform: 'none',
    },
  },

  modeToggleIcon: {
    fontSize: '1.1rem',
  },

  buttonRow: {
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  },

  singleButtonRow: {
    gridTemplateColumns: '1fr',
  },

  button: {
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: theme.spacing(1.5),
    boxShadow: theme.shadows[6],
    lineHeight: '1 !important',
    margin: 0,
    minHeight: 88,
    overflow: 'hidden',
    position: 'relative',
    textAlign: 'center',
    transform: 'translateY(0)',
    transition: theme.transitions.create(['box-shadow', 'filter', 'transform'], {
      duration: theme.transitions.duration.short,
    }),

    '&::before': {
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0))',
      content: '""',
      inset: 0,
      opacity: 0.45,
      pointerEvents: 'none',
      position: 'absolute',
    },

    '&:hover': {
      filter: 'saturate(1.12)',
      transform: 'translateY(-2px)',
    },

    '&:active': {
      transform: 'translateY(0)',
    },
  },

  buttonText: {
    display: 'block',
    fontSize: '0.76rem',
    letterSpacing: '0.08em',
    lineHeight: 1.2,
    minHeight: '2.4em',
    position: 'relative',
    textTransform: 'uppercase',
  },
}));

const COMMAND_BUTTONS = Object.freeze([
  {
    key: 'turnMotorsOn',
    color: Colors.success,
    icon: PlayArrow,
    labelKey: 'arm',
  },
  {
    key: 'turnMotorsOff',
    color: Colors.info,
    icon: Clear,
    labelKey: 'disarm',
  },
  {
    key: 'startShow',
    color: deepPurple[500],
    icon: RocketLaunch,
    labelKey: 'manualShowStart',
    fullWidth: true,
  },
  {
    key: 'holdPosition',
    color: Colors.positionHold,
    icon: PositionHold,
    labelKey: 'hold',
  },
  {
    key: 'returnToHome',
    color: Colors.warning,
    icon: Home,
    labelKey: 'RTH',
  },
  {
    key: 'land',
    color: Colors.seriousWarning,
    icon: FlightLand,
    labelKey: 'land',
  },
  {
    key: 'shutdown',
    color: Colors.error,
    icon: PowerSettingsNew,
    labelKey: 'shutdown',
  },
]);

const LargeControlButtonGroup = ({
  broadcast,
  onChangeBroadcastMode,
  t,
  uavActions,
}) => {
  const classes = useStyles();
  const mode = broadcast ? 'broadcast' : 'selection';
  const buttons = [];
  let row = [];

  COMMAND_BUTTONS.forEach((button) => {
    const Icon = button.icon;
    const element = (
      <ColoredButton
        key={button.key}
        className={classes.button}
        color={button.color}
        icon={<Icon fontSize='inherit' />}
        onClick={uavActions[button.key]}
      >
        <span className={classes.buttonText}>
          {t(`largeControlButtonGroup.${button.labelKey}`)}
        </span>
      </ColoredButton>
    );

    if (button.fullWidth) {
      if (row.length > 0) {
        buttons.push(row);
        row = [];
      }

      buttons.push([element]);
      return;
    }

    row.push(element);

    if (row.length === 2) {
      buttons.push(row);
      row = [];
    }
  });

  if (row.length > 0) {
    buttons.push(row);
  }

  return (
    <Box className={classes.commandDeck}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        aria-label={t('largeControlButtonGroup.modeToggleLabel')}
        className={classes.modeToggle}
        color='primary'
        size='small'
        value={mode}
        onChange={onChangeBroadcastMode}
      >
        <ToggleButton
          aria-label={t('largeControlButtonGroup.selectionOnly')}
          value='selection'
        >
          <AdsClick className={classes.modeToggleIcon} />
          {t('largeControlButtonGroup.modeSelection')}
        </ToggleButton>
        <ToggleButton
          aria-label={t('largeControlButtonGroup.broadcast')}
          value='broadcast'
        >
          <Cast className={classes.modeToggleIcon} />
          {t('largeControlButtonGroup.modeBroadcast')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography className={classes.modeHint} variant='caption'>
        {broadcast
          ? t('largeControlButtonGroup.targetBroadcast')
          : t('largeControlButtonGroup.targetSelection')}
      </Typography>

      {buttons.map((rowButtons, index) => (
        <Box
          key={index}
          className={`${classes.buttonRow} ${
            rowButtons.length === 1 ? classes.singleButtonRow : ''
          }`}
        >
          {rowButtons}
        </Box>
      ))}
    </Box>
  );
};

LargeControlButtonGroup.propTypes = {
  broadcast: PropTypes.bool,
  onChangeBroadcastMode: PropTypes.func,
  t: PropTypes.func,
  uavActions: PropTypes.objectOf(PropTypes.func),
};

export default connect(
  // mapStateToProps
  (state) => ({
    allUAVIdsInMission: getUAVIdsParticipatingInMission(state),
    broadcast: areFlightCommandsBroadcast(state),
    channel: getPreferredCommunicationChannelIndex(state),
    selectedUAVIds: getSelectedUAVIds(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onChangeBroadcastMode: (_event, value) => {
      if (value) {
        dispatch(setCommandsAreBroadcast(value === 'broadcast'));
      }
    },

    uavActions: bindActionCreators(
      createUAVOperationThunks({
        /* In this panel, the targeted UAV IDs depend on whether the panel is
         * in broadcast mode. In broadcast mode, we send a message targeted at
         * all UAVs that are in the mission, allowing the server to broadcast
         * if that's easier. In selection mode, we target the current UAV
         * selection. */
        getTargetedUAVIds(state) {
          const broadcast = areFlightCommandsBroadcast(state);
          return broadcast
            ? getUAVIdsParticipatingInMission(state)
            : getSelectedUAVIds(state);
        },

        /* Transport options depend on whether we are preferring the secondary
         * comms channel and whether the panel is in broadcast mode */
        getTransportOptions(state) {
          return {
            channel: getPreferredCommunicationChannelIndex(state),
            broadcast: areFlightCommandsBroadcast(state),
          };
        },
      }),
      dispatch
    ),
  })
)(withTranslation()(LargeControlButtonGroup));
