import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useToggle } from 'react-use';

import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import ActionFlightTakeoff from '@material-ui/icons/FlightTakeoff';
import ActionFlightLand from '@material-ui/icons/FlightLand';
import ActionHome from '@material-ui/icons/Home';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import Message from '@material-ui/icons/Message';
import Refresh from '@material-ui/icons/Refresh';

import ToggleButton from '~/components/ToggleButton';

import {
  selectUAVInMessagesDialog,
  showMessagesDialog
} from '~/actions/messages';
import * as messaging from '~/utils/messaging';

const useStyles = makeStyles(
  theme => ({
    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5)
    }
  }),
  { name: 'UAVOperationsButtonGroup' }
);

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVOperationsButtonGroup = ({
  selectedUAVIds,
  selectUAVInMessagesDialog,
  showMessagesDialog
}) => {
  const [useAllUAVs, toggleUseAllUAVs] = useToggle();

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
      <ToggleButton
        disabled
        value="all"
        selected={useAllUAVs}
        onChange={toggleUseAllUAVs}
      >
        All
      </ToggleButton>

      <Divider className={classes.divider} orientation="vertical" />

      <IconButton disabled={isSelectionEmpty} onClick={takeoffSelectedUAVs}>
        <ActionFlightTakeoff />
      </IconButton>
      <IconButton disabled={isSelectionEmpty} onClick={landSelectedUAVs}>
        <ActionFlightLand />
      </IconButton>
      <IconButton
        disabled={isSelectionEmpty}
        onClick={returnToHomeSelectedUAVs}
      >
        <ActionHome />
      </IconButton>
      <IconButton
        disabled={!isSelectionSingle}
        onClick={selectUAVAndShowMessagesDialog}
      >
        <Message />
      </IconButton>

      <Divider className={classes.divider} orientation="vertical" />

      <IconButton disabled={isSelectionEmpty} onClick={resetSelectedUAVs}>
        <Refresh
          color={isSelectionEmpty ? undefined : 'secondary'}
          disabled={isSelectionEmpty}
        />
      </IconButton>
      <IconButton disabled={isSelectionEmpty} onClick={haltSelectedUAVs}>
        <ActionPowerSettingsNew
          color={isSelectionEmpty ? undefined : 'secondary'}
        />
      </IconButton>
    </>
  );
};

UAVOperationsButtonGroup.propTypes = {
  selectUAVInMessagesDialog: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  showMessagesDialog: PropTypes.func
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  dispatch => ({
    selectUAVInMessagesDialog(id) {
      dispatch(selectUAVInMessagesDialog(id));
    },
    showMessagesDialog() {
      dispatch(showMessagesDialog());
    }
  })
)(UAVOperationsButtonGroup);
