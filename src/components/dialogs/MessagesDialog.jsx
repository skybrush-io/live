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
import EventListener, { withOptions } from 'react-event-listener';
import { connect } from 'react-redux';

import { MessagesPanel } from '../chat';

import {
  closeMessagesDialog,
  clearMessagesOfSelectedUAV,
} from '~/actions/messages';
import SignalListener from '~/components/SignalListener';
import Flock from '~/model/flock';

import { focusMessagesDialogUAVSelectorFieldSignal } from '~/signals';

/**
 * Presentation component for the "Messages" dialog.
 */
class MessagesDialogPresentation extends React.Component {
  static propTypes = {
    flock: PropTypes.instanceOf(Flock),
    isOpen: PropTypes.bool.isRequired,
    onClear: PropTypes.func,
    onClose: PropTypes.func,
    selectedUAVId: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this._messagesPanel = null;
    this._setMessagesPanel = this._setMessagesPanel.bind(this);

    this._focusUAVSelectorField = this._focusUAVSelectorField.bind(this);
    this._handleKeyWhileOpen = this._handleKeyWhileOpen.bind(this);
  }

  /**
   * Sets the focus on the UAV selector field if the messages panel is shown.
   */
  _focusUAVSelectorField() {
    if (this._messagesPanel) {
      this._messagesPanel.focusOnUAVSelectorField();
    }
  }

  /**
   * Event handler for keypresses while the dialog is open to capture
   * specific hotkeys.
   *
   * @param {KeyboardEvent} e  the keypress event
   */
  _handleKeyWhileOpen(e) {
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
    const { flock, isOpen, onClear, onClose, selectedUAVId } = this.props;

    const actions = [
      <Button key='clear' disabled={!selectedUAVId} onClick={onClear}>
        Clear
      </Button>,
      <Button key='close' onClick={onClose}>
        Close
      </Button>,
    ];

    return (
      <Dialog fullWidth open={isOpen} onClose={onClose}>
        <EventListener
          target={document.body}
          onKeyDown={withOptions(this._handleKeyWhileOpen, { capture: true })}
        />
        <SignalListener
          target={focusMessagesDialogUAVSelectorFieldSignal}
          onDispatched={this._focusUAVSelectorField}
        />
        <MessagesPanel
          ref={this._setMessagesPanel}
          textFieldsAtBottom
          style={{ height: '35ex' }}
          flock={flock}
        />
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

/**
 * Messages dialog container component to bind it to the Redux store.
 */
const MessagesDialog = connect(
  // mapStateToProps
  (state) => {
    const { dialogVisible } = state.dialogs.messages;
    const { messages } = state;
    const { selectedUAVId } = messages;
    return {
      selectedUAVId,
      isOpen: dialogVisible,
    };
  },

  // mapDispatchToProps
  (dispatch) => ({
    onClear() {
      dispatch(clearMessagesOfSelectedUAV());
    },

    onClose() {
      dispatch(closeMessagesDialog());
    },
  })
)(MessagesDialogPresentation);

export default MessagesDialog;
