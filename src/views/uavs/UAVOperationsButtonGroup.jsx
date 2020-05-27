import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import ActionFlightTakeoff from '@material-ui/icons/FlightTakeoff';
import ActionFlightLand from '@material-ui/icons/FlightLand';
import ActionHome from '@material-ui/icons/Home';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import Message from '@material-ui/icons/Message';
import Refresh from '@material-ui/icons/Refresh';
import Tooltip from '~/components/Tooltip';

import {
  selectUAVInMessagesDialog,
  showMessagesDialog,
} from '~/actions/messages';
import * as messaging from '~/utils/messaging';

const useStyles = makeStyles(
  (theme) => ({
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5),
    },
  }),
  { name: 'UAVOperationsButtonGroup' }
);

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVOperationsButtonGroup = ({
  selectedUAVIds,
  selectUAVInMessagesDialog,
  showMessagesDialog,
}) => {
  const classes = useStyles();

  const isSelectionEmpty = isEmpty(selectedUAVIds);
  const isSelectionSingle = selectedUAVIds.length === 1;

  const takeoffSelectedUAVs = () => {
    messaging.takeoffUAVs(selectedUAVIds);
  };

  const landSelectedUAVs = () => {
    messaging.landUAVs(selectedUAVIds);
  };

  const resetSelectedUAVs = () => {
    messaging.resetUAVs(selectedUAVIds);
  };

  const returnToHomeSelectedUAVs = () => {
    messaging.returnToHomeUAVs(selectedUAVIds);
  };

  const selectUAVAndShowMessagesDialog = () => {
    if (isSelectionSingle) {
      selectUAVInMessagesDialog(selectedUAVIds[0]);
    }

    showMessagesDialog();
  };

  const haltSelectedUAVs = () => {
    messaging.haltUAVs(selectedUAVIds);
  };

  return (
    <>
      <Tooltip content='Takeoff'>
        <IconButton disabled={isSelectionEmpty} onClick={takeoffSelectedUAVs}>
          <ActionFlightTakeoff />
        </IconButton>
      </Tooltip>

      <Tooltip content='Land'>
        <IconButton disabled={isSelectionEmpty} onClick={landSelectedUAVs}>
          <ActionFlightLand />
        </IconButton>
      </Tooltip>

      <Tooltip content='Return to home'>
        <IconButton
          disabled={isSelectionEmpty}
          onClick={returnToHomeSelectedUAVs}
        >
          <ActionHome />
        </IconButton>
      </Tooltip>

      <Tooltip content='Send message'>
        <IconButton
          disabled={!isSelectionSingle}
          onClick={selectUAVAndShowMessagesDialog}
        >
          <Message />
        </IconButton>
      </Tooltip>

      <Divider className={classes.divider} orientation='vertical' />

      <Tooltip content='Reboot'>
        <IconButton disabled={isSelectionEmpty} onClick={resetSelectedUAVs}>
          <Refresh
            color={isSelectionEmpty ? undefined : 'secondary'}
            disabled={isSelectionEmpty}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content='Power off'>
        <IconButton disabled={isSelectionEmpty} onClick={haltSelectedUAVs}>
          <ActionPowerSettingsNew
            color={isSelectionEmpty ? undefined : 'secondary'}
          />
        </IconButton>
      </Tooltip>
    </>
  );
};

UAVOperationsButtonGroup.propTypes = {
  selectUAVInMessagesDialog: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  showMessagesDialog: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch) => ({
    selectUAVInMessagesDialog(id) {
      dispatch(selectUAVInMessagesDialog(id));
    },
    showMessagesDialog() {
      dispatch(showMessagesDialog());
    },
  })
)(UAVOperationsButtonGroup);
