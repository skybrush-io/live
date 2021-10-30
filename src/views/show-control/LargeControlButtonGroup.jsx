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
import { getSelectedUAVIds } from '~/selectors/selection';
import { createMultipleUAVRelatedActions } from '~/utils/messaging';

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
  allUAVIdsInMission,
  broadcast,
  channel,
  onChangeBroadcastMode,
  selectedUAVIds,
}) => {
  const classes = useStyles();
  const {
    haltUAVs,
    landUAVs,
    positionHoldUAVs,
    returnToHomeUAVs,
    /*
    takeoffUAVs,
    */
    turnMotorsOffForUAVs,
    turnMotorsOnForUAVs,
  } = createMultipleUAVRelatedActions(
    broadcast ? allUAVIdsInMission : selectedUAVIds,
    {
      broadcast,
      channel,
    }
  );

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
          onClick={turnMotorsOnForUAVs}
        >
          {broadcast ? 'Arm all' : 'Arm'}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.info}
          icon={<Clear fontSize='inherit' />}
          onClick={turnMotorsOffForUAVs}
        >
          {broadcast ? 'Disarm all' : 'Disarm'}
        </ColoredButton>
      </Box>
      <Box display='flex' flexDirection='row' flex={1}>
        <ColoredButton
          className={classes.button}
          color={Colors.warning}
          icon={<PositionHold fontSize='inherit' />}
          onClick={positionHoldUAVs}
        >
          {broadcast ? 'Hold all' : 'Hold'}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.warning}
          icon={<Home fontSize='inherit' />}
          onClick={returnToHomeUAVs}
        >
          {broadcast ? 'RTH all' : 'RTH'}
        </ColoredButton>
      </Box>
      <Box display='flex' flexDirection='row' flex={1} mb={0.5}>
        <ColoredButton
          className={classes.button}
          color={Colors.seriousWarning}
          icon={<FlightLand fontSize='inherit' />}
          onClick={landUAVs}
        >
          {broadcast ? 'Land all' : 'Land'}
        </ColoredButton>
        <ColoredButton
          className={classes.button}
          color={Colors.error}
          icon={<PowerSettingsNew fontSize='inherit' />}
          onClick={haltUAVs}
        >
          {broadcast ? 'Halt all' : 'Halt'}
        </ColoredButton>
      </Box>
    </>
  );
};

LargeControlButtonGroup.propTypes = {
  allUAVIdsInMission: PropTypes.arrayOf(PropTypes.string),
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
    allUAVIdsInMission: getUAVIdsParticipatingInMission(state),
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
