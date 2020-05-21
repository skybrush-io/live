/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import flatMap from 'lodash-es/flatMap';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';

import ActiveUAVsField from '../ActiveUAVsField';
import BackgroundHint from '../BackgroundHint';

import ChatArea from './ChatArea';
import ChatBubble from './ChatBubble';
import Marker from './Marker';

import {
  addInboundMessage,
  addOutboundMessageToSelectedUAV,
  addErrorMessageInMessagesDialog,
} from '~/actions/messages';
import { formatCommandResponseAsHTML } from '~/flockwave/formatting';
import { parseCommandFromString } from '~/flockwave/messages';
import Flock from '~/model/flock';
import { MessageType } from '~/model/messages';
import messageHub from '~/message-hub';
import { selectMessagesOfSelectedUAVInOrder } from '~/selectors/messages';

/**
 * Converts a message object from the Redux store into React components
 * that can render it nicely.
 *
 * @param {Object} message  the message to convert
 * @return {React.Component[]}  the React components that render the message
 */
function convertMessageToComponent(message) {
  const keyBase = `message${message.id}`;
  const inProgress = !message.responseId;
  switch (message.type) {
    case MessageType.OUTBOUND:
      return [
        <ChatBubble
          key={keyBase}
          own
          author={message.author}
          raw={message.raw}
          date={message.date}
          body={message.body}
          rightComponent={
            inProgress ? (
              <CircularProgress
                size={30}
                thickness={1.75}
                style={{ margin: 10 }}
              />
            ) : (
              false
            )
          }
        />,
      ];

    case MessageType.INBOUND:
      return [
        <ChatBubble
          key={keyBase}
          author={message.author}
          own={false}
          raw={message.raw}
          date={message.date}
          body={message.body}
        />,
      ];

    case MessageType.ERROR:
      return [
        <Marker
          key={keyBase + 'Marker'}
          level='error'
          message={message.body}
        />,
      ];

    default:
      return [
        <Marker
          key={keyBase + 'Marker'}
          level='error'
          message={`Invalid message type: ${message.type}`}
        />,
      ];
  }
}

/**
 * Specialized background hint for the chat area.
 */
const ChatAreaBackgroundHint = ({ hasSelectedUAV, textFieldPlacement }) =>
  hasSelectedUAV ? (
    <BackgroundHint
      key='backgroundHint'
      header='No messages'
      text={`Send a message to the selected UAV using the text box ${
        textFieldPlacement === 'bottom' ? 'below' : 'above'
      }`}
    />
  ) : (
    <BackgroundHint
      key='backgroundHint'
      header='No UAV selected'
      text={`Enter the ID of a UAV to talk to in the ${
        textFieldPlacement === 'bottom' ? 'lower left' : 'upper left'
      } corner`}
    />
  );

ChatAreaBackgroundHint.propTypes = {
  hasSelectedUAV: PropTypes.bool,
  textFieldPlacement: PropTypes.oneOf(['bottom', 'top']),
};

/**
 * Presentation component for the "Messages" panel, containing a text field
 * to type the messages into, and a target UAV selector.
 */
class MessagesPanelPresentation extends React.Component {
  static propTypes = {
    chatEntries: PropTypes.arrayOf(PropTypes.object),
    flock: PropTypes.instanceOf(Flock),
    onSend: PropTypes.func,
    selectedUAVId: PropTypes.string,
    style: PropTypes.object,
    textFieldPlacement: PropTypes.oneOf(['bottom', 'top']),
  };

  static defaultProps = {
    textFieldPlacement: 'bottom',
  };

  constructor(props) {
    super(props);

    this._chatAreaRef = React.createRef();
    this._messageFieldRef = React.createRef();
    this._uavSelectorFieldRef = React.createRef();

    this.focusOnTextField = this.focusOnTextField.bind(this);
    this._textFieldKeyDownHandler = this._textFieldKeyDownHandler.bind(this);
  }

  focusOnUAVSelectorField() {
    if (this._uavSelectorFieldRef.current) {
      this._uavSelectorFieldRef.current.focus();
    }
  }

  focusOnTextField() {
    if (this._messageFieldRef.current) {
      this._messageFieldRef.current.focus();
    }
  }

  render() {
    const {
      chatEntries,
      flock,
      selectedUAVId,
      style,
      textFieldPlacement,
    } = this.props;
    const chatComponents = flatMap(chatEntries, convertMessageToComponent);
    const contentStyle = {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      ...style,
    };
    const chatArea =
      chatComponents.length > 0 ? (
        <ChatArea key='chatArea' ref={this._chatAreaRef} px={2} pt={2}>
          {chatComponents}
        </ChatArea>
      ) : (
        <ChatAreaBackgroundHint
          key='chatAreaBackgroundHint'
          hasSelectedUAV={!isNil(chatEntries)}
          textFieldPlacement={textFieldPlacement}
        />
      );
    const textFields = (
      <Box
        key='textFieldContainer'
        display='flex'
        className='bottom-bar'
        pt={1}
        px={2}
      >
        <ActiveUAVsField
          initialValue={selectedUAVId}
          inputRef={this._uavSelectorFieldRef}
          style={{ width: '8em', paddingRight: '1em' }}
          flock={flock}
          commitWhenInvalid
        />
        <TextField
          fullWidth
          inputRef={this._messageFieldRef}
          label='Message'
          onKeyDown={this._textFieldKeyDownHandler}
        />
      </Box>
    );
    const children =
      textFieldPlacement === 'bottom'
        ? [chatArea, textFields]
        : [textFields, chatArea];
    return <div style={contentStyle}>{children}</div>;
  }

  scrollToBottom() {
    if (this._chatAreaRef.current) {
      this._chatAreaRef.current.scrollToBottom();
    }
  }

  /**
   * Handler called when the user presses a key in the message text field.
   * Sends the message if the user presses Enter.
   *
   * @param  {KeyboardEvent} event  the DOM event for the keypress
   * @return {undefined}
   */
  _textFieldKeyDownHandler(event) {
    if (event.keyCode === 13) {
      this.props.onSend(event.target.value);
      event.target.value = '';
      this.scrollToBottom();
    }
  }
}

/**
 * Messages panel container component to bind it to the Redux store.
 */
const MessagesPanel = connect(
  // mapStateToProps
  (state) => ({
    chatEntries: selectMessagesOfSelectedUAVInOrder(state),
    selectedUAVId: state.messages.selectedUAVId
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onSend(message) {
      // Dispatch a Redux action. This will update the store but will not
      // send any actual message
      const action = addOutboundMessageToSelectedUAV(message);
      dispatch(action);

      // Parse the message and extract positional and keyword arguments
      const { command, args, kwds } = parseCommandFromString(message);

      // Now also send the message via the message hub
      const { uavId, messageId } = action;
      messageHub
        .sendCommandRequest({ uavId, command, args, kwds })
        .then(
          // Success handler
          (message) => {
            const { response } = message.body;
            const formattedMessage = formatCommandResponseAsHTML(response);
            dispatch(addInboundMessage(formattedMessage, messageId));
          }
        )
        .catch(
          // Error handler
          (error) => {
            const errorMessage = error.userMessage || error.message;
            dispatch(
              addErrorMessageInMessagesDialog(errorMessage, uavId, messageId)
            );
          }
        );
    },
  }),

  // mergeProps
  null,

  // options
  { forwardRef: true }

  // ref is needed because we want to access the scrollToBottom() method
  // from the outside
)(MessagesPanelPresentation);

export default MessagesPanel;
