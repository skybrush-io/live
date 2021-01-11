import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import Clear from '@material-ui/icons/Clear';
import Home from '@material-ui/icons/Home';
// import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import FlightLand from '@material-ui/icons/FlightLand';
// import Sync from '@material-ui/icons/Sync';

import Colors from '~/components/colors';
import {
  areFlightCommandsBroadcast,
  getPreferredCommunicationChannelIndex,
} from '~/features/mission/selectors';
import { setCommandsAreBroadcast } from '~/features/mission/slice';
import { getSelectedUAVIds } from '~/selectors/selection';
import { createMultipleUAVRelatedActions } from '~/utils/messaging';

import ControlButton from './ControlButton';
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
    },
  }),
  {
    name: 'ShowControlPanelUpperSegment',
  }
);

const LargeControlButtonGroup = ({
  broadcast,
  channel,
  onChangeBroadcastMode,
  selectedUAVIds,
}) => {
  const classes = useStyles();
  const {
    haltSelectedUAVs,
    landSelectedUAVs,
    returnToHomeSelectedUAVs,
    /*
    takeoffSelectedUAVs,
    turnMotorsOnForSelectedUAVs,
    */
  } = createMultipleUAVRelatedActions(selectedUAVIds, {
    broadcast,
    channel,
  });

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
      {/*
      <Box display='flex' flexDirection='row' flex={1}>
        <ControlButton
          className={classes.button}
          color={Colors.info}
          icon={<Sync fontSize='inherit' />}
          onClick={turnMotorsOnForSelectedUAVs}
        >
          Motor on
        </ControlButton>
        <ControlButton
          className={classes.button}
          color={Colors.success}
          icon={<FlightTakeoff fontSize='inherit' />}
          onClick={takeoffSelectedUAVs}
        >
          Start
        </ControlButton>
      </Box>
      */}
      <ControlButton
        className={classes.button}
        color={Colors.warning}
        icon={<Home fontSize='inherit' />}
        onClick={returnToHomeSelectedUAVs}
      >
        {broadcast ? 'RTH all' : 'RTH'}
      </ControlButton>
      <Box display='flex' flexDirection='row' flex={1} mb={0.5}>
        <ControlButton
          className={classes.button}
          color={Colors.seriousWarning}
          icon={<FlightLand fontSize='inherit' />}
          onClick={landSelectedUAVs}
        >
          {broadcast ? 'Land all' : 'Land'}
        </ControlButton>
        <ControlButton
          className={classes.button}
          color={Colors.error}
          icon={<Clear fontSize='inherit' />}
          onClick={haltSelectedUAVs}
        >
          {broadcast ? 'Halt all' : 'Halr'}
        </ControlButton>
      </Box>
    </>
  );
};

LargeControlButtonGroup.propTypes = {
  broadcast: PropTypes.bool,
  channel: PropTypes.number,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  onChangeBroadcastMode: PropTypes.func,
};

LargeControlButtonGroup.defaultProps = {
  broadcast: false,
  channel: 0,
};

export default connect(
  // mapStateToProps
  (state) => ({
    broadcast: areFlightCommandsBroadcast(state),
    channel: getPreferredCommunicationChannelIndex(state),
    selectedUAVIds: getSelectedUAVIds(state),
  }),
  // mapDispatchToProps
  {
    onChangeBroadcastMode: (event) =>
      setCommandsAreBroadcast(Boolean(event.target.checked)),
  }
)(LargeControlButtonGroup);
