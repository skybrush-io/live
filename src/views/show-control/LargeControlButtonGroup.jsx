import Clear from '@mui/icons-material/Clear';
import PositionHold from '@mui/icons-material/Flag';
import FlightLand from '@mui/icons-material/FlightLand';
import Home from '@mui/icons-material/Home';
import PlayArrow from '@mui/icons-material/PlayArrow';
import PowerSettingsNew from '@mui/icons-material/PowerSettingsNew';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import { bindActionCreators } from '@reduxjs/toolkit';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

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

const useStyles = makeStyles(
  (theme) => ({
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

    button: {
      flex: 1,
      margin: theme.spacing(0.5),
      lineHeight: 1,
    },
  }),
  {
    name: 'LargeControlButtonGroup',
  }
);

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
      <Box display='flex' alignItems='center' flexDirection='row' mt={0.5}>
        <Box flex='1' textAlign='right'>
          <Typography
            variant='body2'
            color={!broadcast ? 'textPrimary' : 'textSecondary'}
          >
            {t('largeControlButtonGroup.selectionOnly')}
          </Typography>
        </Box>
        <Switch checked={broadcast} onChange={onChangeBroadcastMode} />
        <Box flex='1'>
          <Typography
            variant='body2'
            color={broadcast ? 'textPrimary' : 'textSecondary'}
          >
            {t('largeControlButtonGroup.broadcast')}
          </Typography>
        </Box>
      </Box>
      <Box display='flex' flexDirection='row' flex={1}>
        <ColoredButton
          className={classes.button}
          color={Colors.success}
          icon={<PlayArrow fontSize='inherit' />}
          onClick={uavActions.turnMotorsOn}
        >
          {broadcast
            ? t('largeControlButtonGroup.armAll')
            : t('largeControlButtonGroup.arm')}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.info}
          icon={<Clear fontSize='inherit' />}
          onClick={uavActions.turnMotorsOff}
        >
          {broadcast
            ? t('largeControlButtonGroup.disarmAll')
            : t('largeControlButtonGroup.disarm')}
        </ColoredButton>
      </Box>
      <Box display='flex' flexDirection='row' flex={1}>
        <ColoredButton
          className={classes.button}
          color={Colors.positionHold}
          icon={<PositionHold fontSize='inherit' />}
          onClick={uavActions.holdPosition}
        >
          {broadcast
            ? t('largeControlButtonGroup.holdAll')
            : t('largeControlButtonGroup.hold')}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.warning}
          icon={<Home fontSize='inherit' />}
          onClick={uavActions.returnToHome}
        >
          {broadcast
            ? t('largeControlButtonGroup.RTHAll')
            : t('largeControlButtonGroup.RTH')}
        </ColoredButton>
      </Box>
      <Box display='flex' flexDirection='row' flex={1} mb={0.5}>
        <ColoredButton
          className={classes.button}
          color={Colors.seriousWarning}
          icon={<FlightLand fontSize='inherit' />}
          onClick={uavActions.land}
        >
          {broadcast
            ? t('largeControlButtonGroup.landAll')
            : t('largeControlButtonGroup.land')}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.error}
          icon={<PowerSettingsNew fontSize='inherit' />}
          onClick={uavActions.shutdown}
        >
          {broadcast
            ? t('largeControlButtonGroup.shutdownAll')
            : t('largeControlButtonGroup.shutdown')}
        </ColoredButton>
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
