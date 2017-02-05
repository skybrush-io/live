/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import _ from 'lodash'
import CircularProgress from 'material-ui/CircularProgress'
import TextField from 'material-ui/TextField'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { addInboundMessage, addOutboundMessageToSelectedUAV,
         addErrorMessageInMessagesDialog } from '../../actions/messages'
import ActiveUAVsField from '../ActiveUAVsField'
import BackgroundHint from '../BackgroundHint'
import { ChatArea, ChatBubble, Marker } from '../chat'
import Flock from '../../model/flock'
import { MessageType } from '../../model/messages'
import messageHub from '../../message-hub'

/**
 * Converts a message object from the Redux store into React components
 * that can render it nicely.
 *
 * @param {Object} message  the message to convert
 * @return {React.Component[]}  the React components that render the message
 */
function convertMessageToComponent (message) {
  const keyBase = `message${message.id}`
  const inProgress = !message.responseId
  switch (message.type) {
    case MessageType.OUTBOUND:
      return [
        <ChatBubble key={keyBase} author={message.author} own={true}
          date={message.date} body={message.body}
          rightComponent={inProgress ? <CircularProgress size={30} thickness={1.75} style={{ margin: 10 }} /> : false}
          />
      ]

    case MessageType.INBOUND:
      return [
        <ChatBubble key={keyBase} author={message.author} own={false}
          date={message.date} body={message.body} />
      ]

    case MessageType.ERROR:
      return [
        <Marker key={keyBase + 'Marker'} level="error"
          message={message.body} />
      ]

    default:
      return [
        <Marker key={keyBase + 'Marker'} level="error"
          message={`Invalid message type: ${message.type}`} />
      ]
  }
}

/**
 * Converts a collection of message objects from the Redux store into React
 * component that can render them nicely.
 *
 * @param {Object[]} messages  the messages to convert
 * @return {React.Component[]}  the React components that render the message
 */
function convertMessagesToComponents (messages) {
  if (_.isNil(messages)) {
    return [
      <BackgroundHint key="backgroundHint" header="No UAV selected"
        text="Enter the ID of a UAV to talk to in the lower left corner" />
    ]
  } else if (messages.length === 0) {
    return [
      <BackgroundHint key="backgroundHint" header="No messages"
        text="Send a message to the selected UAV using the text box below" />
    ]
  } else {
    return _.flatMap(messages, convertMessageToComponent)
  }
}

/**
 * Presentation component for the "Messages" panel, containing a text field
 * to type the messages into, and a target UAV selector.
 */
class MessagesPanelPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.textFieldKeyDownHandler_ = this.textFieldKeyDownHandler_.bind(this)
  }

  render () {
    const { chatEntries, flock, selectedUAVId } = this.props
    const chatComponents = convertMessagesToComponents(chatEntries)
    return (
      <div>
        <ChatArea style={{ height: '35ex' }}>
          {chatComponents}
        </ChatArea>
        <div style={{ display: 'flex' }}>
          <ActiveUAVsField style={{ width: '8em', paddingRight: '1em' }}
            flock={flock} />
          <TextField fullWidth={true} hintText="Message"
            onKeyDown={this.textFieldKeyDownHandler_}
            disabled={_.isNil(selectedUAVId)} />
        </div>
      </div>
    )
  }

  /**
   * Handler called when the user presses a key in the message text field.
   * Sends the message if the user presses Enter.
   *
   * @param  {KeyboardEvent} event  the DOM event for the keypress
   * @return {undefined}
   */
  textFieldKeyDownHandler_ (event) {
    if (event.keyCode === 13) {
      this.props.onSend(event.target.value)
      event.target.value = ''
    }
  }
}

MessagesPanelPresentation.propTypes = {
  chatEntries: PropTypes.arrayOf(PropTypes.object),
  flock: PropTypes.instanceOf(Flock),
  onSend: PropTypes.func,
  selectedUAVId: PropTypes.string
}

/**
 * Messages panel container component to bind it to the Redux store.
 */
const MessagesPanel = connect(
  // mapStateToProps
  state => {
    const { messages } = state
    const { selectedUAVId } = messages
    const messageIds = selectedUAVId
      ? messages.uavIdsToMessageIds[selectedUAVId] : []
    const chatEntries = selectedUAVId
      ? _(messageIds).map(id => messages.byId[id]).reject(_.isNil).value()
      : null
    return {
      chatEntries,
      selectedUAVId
    }
  },

  // mapDispatchToProps
  dispatch => ({
    onSend (message) {
      // Dispatch a Redux action. This will update the store but will not
      // send any actual message
      const action = addOutboundMessageToSelectedUAV(message)
      dispatch(action)

      // Now also send the message via the message hub
      const { uavId, messageId } = action
      messageHub.sendCommandRequest(uavId, message).then(
        // success handler
        message => {
          const { response } = message.body
          dispatch(addInboundMessage(response, messageId))
        },
        // error handler
        error => {
          const message = error.userMessage || error.message
          dispatch(addErrorMessageInMessagesDialog(message, uavId, messageId))
        }
      )
    }
  })
)(MessagesPanelPresentation)

export default MessagesPanel
