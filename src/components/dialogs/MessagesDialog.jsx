/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import PropTypes from 'prop-types';
import React from 'react';
import EventListener, { withOptions } from 'react-event-listener';
import { connect } from 'react-redux';

import { MessagesPanel } from '../chat';

import { clearMessagesOfSelectedUAV } from '~/features/messages/actions';
import { closeMessagesDialog } from '~/features/messages/slice';
import { getSingleSelectedUAVId } from '~/selectors/selection';

/**
 * Presentation component for the "Messages" dialog.
 */
class MessagesDialog extends React.Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClear: PropTypes.func,
    onClose: PropTypes.func,
    selectedUAVId: PropTypes.string,
  };

  constructor() {
    super();
    this._messagesPanel = null;
  }

  /**
   * Event handler for keypresses while the dialog is open to capture
   * specific hotkeys.
   */
  _handleKeyWhileOpen = (event) => {
    if (
      // The active element is not an input
      !['INPUT'].includes(document.activeElement.tagName) &&
      // And the key pressed was not anything special, just a single character
      event.key.length === 1 &&
      // And the messages panel is mounted
      this._messagesPanel
    ) {
      this._messagesPanel.focusOnTextField();
    }
  };

  _setMessagesPanel = (panel) => {
    this._messagesPanel = panel;

    if (this._messagesPanel) {
      // Message panel just got mounted so scroll to the bottom
      this._messagesPanel.scrollToBottom();
    }
  };

  render() {
    const { isOpen, onClear, onClose, selectedUAVId } = this.props;

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
        <MessagesPanel
          ref={this._setMessagesPanel}
          hideClearButton
          style={{ height: '50ex', marginBottom: -8 }}
          uavId={selectedUAVId}
        />
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

/**
 * Messages dialog container component to bind it to the Redux store.
 */
export default connect(
  // mapStateToProps
  (state) => ({
    selectedUAVId: getSingleSelectedUAVId(state),
    isOpen: state.messages.dialogVisible,
  }),

  // mapDispatchToProps
  {
    onClear: clearMessagesOfSelectedUAV,
    onClose: closeMessagesDialog,
  }
)(MessagesDialog);
