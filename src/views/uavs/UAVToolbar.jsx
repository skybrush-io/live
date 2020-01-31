import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useToggle } from 'react-use';

import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import ActionFlightTakeoff from '@material-ui/icons/FlightTakeoff';
import ActionFlightLand from '@material-ui/icons/FlightLand';
import ActionHome from '@material-ui/icons/Home';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import ImageBlurCircular from '@material-ui/icons/BlurCircular';
import ImageBlurOn from '@material-ui/icons/BlurOn';
import Message from '@material-ui/icons/Message';
import Refresh from '@material-ui/icons/Refresh';
import ToggleButton from '@material-ui/lab/ToggleButton';

import {
  selectUAVInMessagesDialog,
  showMessagesDialog
} from '~/actions/messages';
import * as messaging from '~/utils/messaging';

const useStyles = makeStyles(
  theme => ({
    root: {
      padding: theme.spacing(0, 0.5)
    },

    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5)
    },

    toggleButton: {
      border: 0
    }
  }),
  { name: 'UAVToolbar' }
);

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = ({
  fitSelectedUAVs,
  selectedUAVIds,
  selectUAVInMessagesDialog,
  showMessagesDialog
}) => {
  const [useAllUAVs, toggleUseAllUAVs] = useToggle();
  const classes = useStyles();
  const isSelectionEmpty = isEmpty(selectedUAVIds);

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
    if (selectedUAVIds.length === 1) {
      selectUAVInMessagesDialog(selectedUAVIds[0]);
    }

    showMessagesDialog();
  };

  const haltSelectedUAVs = () => {
    messaging.haltUAVs(selectedUAVIds);
  };

  return (
    <Toolbar disableGutters className={classes.root} variant="dense">
      <ToggleButton
        className={classes.toggleButton}
        size="small"
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
        disabled={selectedUAVIds.length !== 1}
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

      <Divider className={classes.divider} orientation="vertical" />

      {fitSelectedUAVs && (
        <IconButton style={{ float: 'right' }} onClick={fitSelectedUAVs}>
          {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
        </IconButton>
      )}
    </Toolbar>
  );
};

UAVToolbar.propTypes = {
  fitSelectedUAVs: PropTypes.func,
  selectUAVInMessagesDialog: PropTypes.func,
  showMessagesDialog: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string)
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  dispatch => ({
    selectUAVInMessagesDialog: id => {
      dispatch(selectUAVInMessagesDialog(id));
    },
    showMessagesDialog: () => {
      dispatch(showMessagesDialog());
    }
  })
)(UAVToolbar);
