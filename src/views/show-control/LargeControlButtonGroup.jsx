import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from '@reduxjs/toolkit';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import Clear from '@material-ui/icons/Clear';
import Home from '@material-ui/icons/Home';
import FlightLand from '@material-ui/icons/FlightLand';
import PositionHold from '@material-ui/icons/Flag';
import PowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import PlayArrow from '@material-ui/icons/PlayArrow';

import Colors from '~/components/colors';
import ColoredButton from '~/components/ColoredButton';
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
            Selection only
          </Typography>
        </Box>
        <Switch checked={broadcast} onChange={onChangeBroadcastMode} />
        <Box flex='1'>
          <Typography
            variant='body2'
            color={broadcast ? 'textPrimary' : 'textSecondary'}
          >
            Broadcast
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
          {broadcast ? 'Arm all' : 'Arm'}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.info}
          icon={<Clear fontSize='inherit' />}
          onClick={uavActions.turnMotorsOff}
        >
          {broadcast ? 'Disarm all' : 'Disarm'}
        </ColoredButton>
      </Box>
      <Box display='flex' flexDirection='row' flex={1}>
        <ColoredButton
          className={classes.button}
          color={Colors.positionHold}
          icon={<PositionHold fontSize='inherit' />}
          onClick={uavActions.holdPosition}
        >
          {broadcast ? 'Hold all' : 'Hold'}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.warning}
          icon={<Home fontSize='inherit' />}
          onClick={uavActions.returnToHome}
        >
          {broadcast ? 'RTH all' : 'RTH'}
        </ColoredButton>
      </Box>
      <Box display='flex' flexDirection='row' flex={1} mb={0.5}>
        <ColoredButton
          className={classes.button}
          color={Colors.seriousWarning}
          icon={<FlightLand fontSize='inherit' />}
          onClick={uavActions.land}
        >
          {broadcast ? 'Land all' : 'Land'}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.error}
          icon={<PowerSettingsNew fontSize='inherit' />}
          onClick={uavActions.shutdown}
        >
          {broadcast ? 'Shutdown all' : 'Shutdown'}
        </ColoredButton>
      </Box>
    </>
  );
};

LargeControlButtonGroup.propTypes = {
  broadcast: PropTypes.bool,
  onChangeBroadcastMode: PropTypes.func,
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
)(LargeControlButtonGroup);
