/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  closeMessagesDialog,
  clearMessagesOfSelectedUAV
} from '../../actions/messages';
import { MessagesPanel } from '../chat';
import Flock from '../../model/flock';

import { focusMessagesDialogUAVSelectorFieldSignal } from '../../signals';

/**
 * Presentation component for the "Messages" dialog.
 */
class MessagesDialogPresentation extends React.Component {
  constructor(props) {
    super(props);

    this._messagesPanel = null;

    this._onOpen = this._onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
    this._setMessagesPanel = this._setMessagesPanel.bind(this);
    this._wasOpen = false;

    this._handleKeyWhileOpen = this._handleKeyWhileOpen.bind(this);
  }

  _onOpen() {
    document.body.addEventListener('keydown', this._handleKeyWhileOpen, true);
  }

  _onClose() {
    document.body.removeEventListener(
      'keydown',
      this._handleKeyWhileOpen,
      true
    );
    setTimeout(() => {
      document.querySelector('.ol-viewport').focus();
    }, 100);
  }

  /**
   * Event handler for keypresses while the dialog is open to capture
   * specific hotkeys.
   *
   * @param {KeyboardEvent} e  the keypress event
   */
  _handleKeyWhileOpen(e) {
    // To prevent panning of the map with the arrow keys and other default
    // hotkeys, but letting Enter pass through for sending the message.
    if (e.key !== 'Enter') {
      e.stopPropagation();
    }

    if (e.key === '@') {
      e.preventDefault();

      focusMessagesDialogUAVSelectorFieldSignal.dispatch();
    } else if (
      // The active element is not an input
      !['INPUT'].includes(document.activeElement.tagName) &&
      // And the key pressed was not anything special, just a single character
      e.key.length === 1 &&
      // And the messages panel is mounted
      this._messagesPanel
    ) {
      this._messagesPanel.focusOnTextField();
    }
  }

  _setMessagesPanel(panel) {
    this._messagesPanel = panel;

    if (this._messagesPanel) {
      // Message panel just got mounted so scroll to the bottom
      this._messagesPanel.scrollToBottom();
    }
  }

  render() {
    const { flock, open, onClear, onClose, selectedUAVId } = this.props;

    if (!this._wasOpen && open) {
      this._onOpen();
    } else if (this._wasOpen && !open) {
      this._onClose();
    }

    this._wasOpen = open;

    const actions = [
      <Button key="clear" disabled={!selectedUAVId} onClick={onClear}>
        Clear
      </Button>,
      <Button key="close" onClick={onClose}>
        Close
      </Button>
    ];

    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <MessagesPanel
            ref={this._setMessagesPanel}
            textFieldsAtBottom
            style={{ height: '35ex' }}
            flock={flock}
          />
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

MessagesDialogPresentation.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  open: PropTypes.bool.isRequired,
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  selectedUAVId: PropTypes.string
};

/**
 * Messages dialog container component to bind it to the Redux store.
 */
const MessagesDialog = connect(
  // MapStateToProps
  state => {
    const { dialogVisible } = state.dialogs.messages;
    const { messages } = state;
    const { selectedUAVId } = messages;
    return {
      selectedUAVId,
      open: dialogVisible
    };
  },

  // MapDispatchToProps
  dispatch => ({
    onClear() {
      dispatch(clearMessagesOfSelectedUAV());
    },

    onClose() {
      dispatch(closeMessagesDialog());
    }
  })
)(MessagesDialogPresentation);

export default MessagesDialog;
