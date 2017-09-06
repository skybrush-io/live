/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { closeMessagesDialog, clearMessagesOfSelectedUAV } from '../actions/messages'
import { MessagesPanel } from '../components/chat'
import Flock from '../model/flock'

import { focusMessagesDialogUAVSelectorField } from '../signals'

/**
 * Presentation component for the "Messages" dialog.
 */
class MessagesDialogPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._onOpen = this._onOpen.bind(this)
    this._onClose = this._onClose.bind(this)
    this._wasOpen = false

    this._handleKeyWhileOpen = this._handleKeyWhileOpen.bind(this)

    window.test = this
  }

  _onOpen () {
    document.body.addEventListener('keydown', this._handleKeyWhileOpen, true)
  }

  _onClose () {
    document.body.removeEventListener('keydown', this._handleKeyWhileOpen, true)
    setTimeout(() => { document.querySelector('.ol-viewport').focus() }, 100)
  }

  /**
   * Event handler for keypresses while the dialog is open to capture
   * specific hotkeys.
   *
   * @param {KeyboardEvent} e
   */
  _handleKeyWhileOpen (e) {
    // To prevent panning of the map with the arrow keys and other default
    // hotkeys, but letting Enter pass through for sending the message.
    if (e.key !== 'Enter') { e.stopPropagation() }

    if (e.key === '@') {
      e.preventDefault()

      focusMessagesDialogUAVSelectorField.dispatch()
    } else if (
      // The active element is not an input
      !['INPUT'].includes(document.activeElement.tagName) &&
      // and the key pressed was not anything special, just a single character
      e.key.length === 1
    ) {
      this.refs.messagesPanel.getWrappedInstance()
          .refs.messageTextField.input.select()
    }
  }

  render () {
    const { flock, open, onClear, onClose, selectedUAVId } = this.props

    if (!this._wasOpen && open) {
      this._onOpen()
    } else if (this._wasOpen && !open) {
      this._onClose()
    }

    this._wasOpen = open

    const actions = [
      <FlatButton label={'Clear'} onTouchTap={onClear}
        disabled={!selectedUAVId} />,
      <FlatButton label={'Close'} onTouchTap={onClose} />
    ]
    const contentStyle = {
      width: '640px'
    }
    return (
      <Dialog
        open={open} contentStyle={contentStyle}
        actions={actions} onRequestClose={onClose}
      >
        <MessagesPanel
          ref={'messagesPanel'} style={{ height: '35ex' }}
          textFieldsAtBottom flock={flock}
        />
      </Dialog>
    )
  }
}

MessagesDialogPresentation.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  open: PropTypes.bool.isRequired,
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  selectedUAVId: PropTypes.string
}

/**
 * Messages dialog container component to bind it to the Redux store.
 */
const MessagesDialog = connect(
  // mapStateToProps
  state => {
    const { dialogVisible } = state.dialogs.messages
    const { messages } = state
    const { selectedUAVId } = messages
    return {
      selectedUAVId,
      open: dialogVisible
    }
  },

  // mapDispatchToProps
  dispatch => ({
    onClear () {
      dispatch(clearMessagesOfSelectedUAV())
    },

    onClose () {
      dispatch(closeMessagesDialog())
    }
  })
)(MessagesDialogPresentation)

export default MessagesDialog
