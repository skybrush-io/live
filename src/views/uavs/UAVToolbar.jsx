import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import ActionFlightTakeoff from '@material-ui/icons/FlightTakeoff';
import ActionFlightLand from '@material-ui/icons/FlightLand';
import ActionHome from '@material-ui/icons/Home';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import ImageBlurCircular from '@material-ui/icons/BlurCircular';
import ImageBlurOn from '@material-ui/icons/BlurOn';
import Message from '@material-ui/icons/Message';
import Refresh from '@material-ui/icons/Refresh';

import {
  selectUAVInMessagesDialog,
  showMessagesDialog
} from '~/actions/messages';
import * as messaging from '~/utils/messaging';

/**
 * Main toolbar for controlling the UAVs.
 */
class UAVToolbar extends React.Component {
  static propTypes = {
    fitSelectedUAVs: PropTypes.func,
    selectUAVInMessagesDialog: PropTypes.func,
    showMessagesDialog: PropTypes.func,
    selectedUAVIds: PropTypes.arrayOf(PropTypes.string)
  };

  render() {
    const { fitSelectedUAVs, selectedUAVIds } = this.props;
    const isSelectionEmpty = isEmpty(selectedUAVIds);

    /* Buttons that can potentially become disabled must be wrapped in a
     * <span> to ensure that the tooltip still works. Otherwise the Tooltip
     * component gives us a warning anyway. */

    return (
      <div>
        <IconButton
          disabled={isSelectionEmpty}
          onClick={this._takeoffSelectedUAVs}
        >
          <ActionFlightTakeoff />
        </IconButton>
        <IconButton
          disabled={isSelectionEmpty}
          onClick={this._landSelectedUAVs}
        >
          <ActionFlightLand />
        </IconButton>
        <IconButton
          disabled={isSelectionEmpty}
          onClick={this._returnToHomeSelectedUAVs}
        >
          <ActionHome />
        </IconButton>
        <IconButton
          disabled={selectedUAVIds.length !== 1}
          onClick={this._showMessagesDialog}
        >
          <Message />
        </IconButton>
        <IconButton
          disabled={isSelectionEmpty}
          onClick={this._resetSelectedUAVs}
        >
          <Refresh
            color={isSelectionEmpty ? undefined : 'secondary'}
            disabled={isSelectionEmpty}
          />
        </IconButton>
        <IconButton
          disabled={isSelectionEmpty}
          onClick={this._haltSelectedUAVs}
        >
          <ActionPowerSettingsNew
            color={isSelectionEmpty ? undefined : 'secondary'}
          />
        </IconButton>

        <IconButton style={{ float: 'right' }} onClick={fitSelectedUAVs}>
          {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
        </IconButton>
      </div>
    );
  }

  _takeoffSelectedUAVs = () => {
    messaging.takeoffUAVs(this.props.selectedUAVIds);
  };

  _landSelectedUAVs = () => {
    messaging.landUAVs(this.props.selectedUAVIds);
  };

  _resetSelectedUAVs = () => {
    messaging.resetUAVs(this.props.selectedUAVIds);
  };

  _returnToHomeSelectedUAVs = () => {
    messaging.returnToHomeUAVs(this.props.selectedUAVIds);
  };

  _showMessagesDialog = () => {
    if (this.props.selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selectedUAVIds[0]);
    }

    this.props.showMessagesDialog();
  };

  _haltSelectedUAVs = () => {
    messaging.haltUAVs(this.props.selectedUAVIds);
  };
}

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
