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

/**
 * Presentation component for the "Messages" dialog.
 */
class MessagesDialogPresentation extends React.Component {
  render () {
    const { flock, open, onClear, onClose, selectedUAVId } = this.props
    const actions = [
      <FlatButton label={'Clear'} onTouchTap={onClear}
        disabled={!selectedUAVId} />,
      <FlatButton label={'Close'} onTouchTap={onClose} />
    ]
    const contentStyle = {
      width: '640px'
    }
    return (
      <Dialog open={open} modal
        contentStyle={contentStyle} actions={actions}>
        <MessagesPanel style={{ height: '35ex' }} textFieldsAtBottom
          flock={flock}
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
