import Clear from '@mui/icons-material/Clear';
import PositionHold from '@mui/icons-material/Flag';
import FlightLand from '@mui/icons-material/FlightLand';
import Home from '@mui/icons-material/Home';
import PlayArrow from '@mui/icons-material/PlayArrow';
import PowerSettingsNew from '@mui/icons-material/PowerSettingsNew';
import RocketLaunch from '@mui/icons-material/RocketLaunch';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
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

import StartMethodExplanation from './StartMethodExplanation';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },

  scrollable: {
    overflow: 'auto',
  },

  commandDeck: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.25, 1.25),
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.015))',
    borderTop: `1px solid ${theme.palette.divider}`,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  },

  modeSwitch: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.055)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: theme.spacing(5),
    display: 'flex',
    flexDirection: 'row',
    padding: theme.spacing(0.25, 1),
  },

  modeLabel: {
    letterSpacing: '0.02em',
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
    fontSize: '0.76rem',
    letterSpacing: '0.08em',
    position: 'relative',
    textTransform: 'uppercase',
  },
}));

const LargeControlButtonGroup = ({
  broadcast,
  onChangeBroadcastMode,
  t,
  uavActions,
}) => {
  const classes = useStyles();
  return (
    <>
      <StartMethodExplanation />
      <Divider />
      <Box className={classes.commandDeck}>
        <Box className={classes.modeSwitch}>
          <Box flex='1' textAlign='right'>
            <Typography
              className={classes.modeLabel}
              variant='body2'
              color={!broadcast ? 'textPrimary' : 'textSecondary'}
            >
              {t('largeControlButtonGroup.selectionOnly')}
            </Typography>
          </Box>
          <Switch checked={broadcast} onChange={onChangeBroadcastMode} />
          <Box flex='1'>
            <Typography
              className={classes.modeLabel}
              variant='body2'
              color={broadcast ? 'textPrimary' : 'textSecondary'}
            >
              {t('largeControlButtonGroup.broadcast')}
            </Typography>
          </Box>
        </Box>

        <Box className={classes.buttonRow}>
          <ColoredButton
            className={classes.button}
            color={Colors.success}
            icon={<PlayArrow fontSize='inherit' />}
            onClick={uavActions.turnMotorsOn}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.armAll')
                : t('largeControlButtonGroup.arm')}
            </span>
          </ColoredButton>
          <ColoredButton
            className={classes.button}
            color={Colors.info}
            icon={<Clear fontSize='inherit' />}
            onClick={uavActions.turnMotorsOff}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.disarmAll')
                : t('largeControlButtonGroup.disarm')}
            </span>
          </ColoredButton>
        </Box>

        <Box className={`${classes.buttonRow} ${classes.singleButtonRow}`}>
          <ColoredButton
            className={classes.button}
            color={deepPurple[500]}
            icon={<RocketLaunch fontSize='inherit' />}
            onClick={uavActions.startShow}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.manualShowStartAll')
                : t('largeControlButtonGroup.manualShowStart')}
            </span>
          </ColoredButton>
        </Box>

        <Box className={classes.buttonRow}>
          <ColoredButton
            className={classes.button}
            color={Colors.positionHold}
            icon={<PositionHold fontSize='inherit' />}
            onClick={uavActions.holdPosition}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.holdAll')
                : t('largeControlButtonGroup.hold')}
            </span>
          </ColoredButton>
          <ColoredButton
            className={classes.button}
            color={Colors.warning}
            icon={<Home fontSize='inherit' />}
            onClick={uavActions.returnToHome}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.RTHAll')
                : t('largeControlButtonGroup.RTH')}
            </span>
          </ColoredButton>
        </Box>

        <Box className={classes.buttonRow}>
          <ColoredButton
            className={classes.button}
            color={Colors.seriousWarning}
            icon={<FlightLand fontSize='inherit' />}
            onClick={uavActions.land}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.landAll')
                : t('largeControlButtonGroup.land')}
            </span>
          </ColoredButton>
          <ColoredButton
            className={classes.button}
            color={Colors.error}
            icon={<PowerSettingsNew fontSize='inherit' />}
            onClick={uavActions.shutdown}
          >
            <span className={classes.buttonText}>
              {broadcast
                ? t('largeControlButtonGroup.shutdownAll')
                : t('largeControlButtonGroup.shutdown')}
            </span>
          </ColoredButton>
        </Box>
      </Box>
    </>
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
    onChangeBroadcastMode: (event) =>
      dispatch(setCommandsAreBroadcast(Boolean(event.target.checked))),

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
