/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import clsx from 'clsx';
import formatDate from 'date-fns/format';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import DeleteSweep from '@material-ui/icons/DeleteSweep';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import ChatArea from './ChatArea';
import ChatBubble from './ChatBubble';
import Marker from './Marker';
import MessageField from './MessageField';

import {
  createMessageListSelector,
  getCommandHistory,
} from '~/features/messages/selectors';
import {
  addErrorMessage,
  addInboundMessage,
  addOutboundMessage,
  clearMessagesOfUAVById,
  updateProgressByMessageId,
} from '~/features/messages/slice';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import { formatCommandResponseAsHTML } from '~/flockwave/formatting';
import { parseCommandFromString } from '~/flockwave/messages';
import { MessageType } from '~/model/enums';
import messageHub from '~/message-hub';

const styles = {
  noFocusOutline: {
    '&:focus': {
      outline: 'none',
    },
  },
};

const dateFormatter = (x) => formatDate(x, 'H:mm');

/**
 * Converts a message object from the Redux store into React components
 * that can render it nicely.
 *
 * @param {Object} message  the message to convert
 * @return {React.Component[]}  the React components that render the message
 */
function convertMessageToComponent(message, state = {}) {
  const keyBase = `message${message.id}`;
  const inProgress = !message.responseId;
  const dateIsNumber = typeof message?.date === 'number';
  const formattedDate = dateIsNumber ? dateFormatter(message.date) : '';
  const author = message?.author;
  const isCloseToPreviousEntry =
    dateIsNumber && Math.abs(state.date - message.date) < 500;
  const showMeta =
    state.author !== author ||
    (state.formattedDate !== formattedDate && !isCloseToPreviousEntry);

  state.author = author;
  state.date = message?.date;
  if (!isCloseToPreviousEntry) {
    state.formattedDate = formattedDate;
  }

  switch (message.type) {
    case MessageType.OUTBOUND:
      return [
        <ChatBubble
          key={keyBase}
          own
          showMeta={showMeta}
          author={author}
          raw={message.raw}
          date={formattedDate}
          body={message.body}
          severity={message.severity}
          rightComponent={
            inProgress ? (
              <CircularProgress
                size={30}
                thickness={3.5}
                style={{ margin: '14px 8px' }}
                value={message.percentage}
                variant={
                  message.percentage !== undefined
                    ? 'determinate'
                    : 'indeterminate'
                }
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
          showMeta={showMeta}
          author={author}
          own={false}
          raw={message.raw}
          date={formattedDate}
          body={message.body}
          severity={message.severity}
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
const ChatAreaBackgroundHint = ({
  hasSelectedUAV,
  textFieldPlacement,
  ...rest
}) =>
  hasSelectedUAV ? (
    <BackgroundHint
      key='backgroundHint'
      header='No messages'
      text={`Send a message to the selected UAV using the text box ${
        textFieldPlacement === 'bottom' ? 'below' : 'above'
      }`}
      {...rest}
    />
  ) : (
    <BackgroundHint
      key='backgroundHint'
      header='No UAV selected'
      text='Select the UAV to send messages to'
      {...rest}
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
class MessagesPanel extends React.Component {
  static propTypes = {
    chatEntries: PropTypes.arrayOf(PropTypes.object),
    classes: PropTypes.object,
    commandHistory: PropTypes.arrayOf(PropTypes.string),
    hideClearButton: PropTypes.bool,
    onClearMessages: PropTypes.func,
    onSend: PropTypes.func,
    optimizeUIForTouch: PropTypes.bool,
    style: PropTypes.object,
    textFieldPlacement: PropTypes.oneOf(['bottom', 'top']),
    uavId: PropTypes.string,
  };

  static defaultProps = {
    textFieldPlacement: 'bottom',
  };

  constructor() {
    super();

    this._chatAreaRef = React.createRef();
    this._messageFieldRef = React.createRef();
    this._messageFieldContainerRef = React.createRef();
    this._uavSelectorFieldRef = React.createRef();

    this.focusOnTextField = this.focusOnTextField.bind(this);
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
      classes,
      commandHistory,
      hideClearButton,
      onClearMessages,
      optimizeUIForTouch,
      style,
      textFieldPlacement,
      uavId,
    } = this.props;

    const formatterState = {};
    const chatComponents = chatEntries.map((entry) =>
      convertMessageToComponent(entry, formatterState)
    );
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
          hasSelectedUAV={!isNil(uavId)}
          textFieldPlacement={textFieldPlacement}
          p={1}
        />
      );
    const isClearButtonVisible = onClearMessages && !hideClearButton;
    const textFields = (
      <Box
        ref={this._messageFieldContainerRef}
        key='textFieldContainer'
        display='flex'
        alignItems='baseline'
        className={clsx('bottom-bar', classes.noFocusOutline)}
        pb={2}
        pl={2}
        pr={isClearButtonVisible ? 0 : 2}
        tabIndex='-1'
        onKeyDown={(e) => {
          if (e.code === 'Enter') {
            this._messageFieldRef.current.focus();
          }
        }}
      >
        <MessageField
          fullWidth
          autoFocus={!optimizeUIForTouch}
          history={commandHistory}
          inputRef={this._messageFieldRef}
          onSubmit={this._onSubmit}
          onEscape={(e) => {
            this._messageFieldContainerRef.current.focus();
            e.stopPropagation();
          }}
        />
        {isClearButtonVisible && (
          <IconButton
            disabled={chatComponents.length === 0}
            style={{ transform: 'translateY(8px)' }}
            onClick={onClearMessages}
          >
            <DeleteSweep />
          </IconButton>
        )}
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

  _onSubmit = (message) => {
    this.props.onSend(message);
    this.scrollToBottom();
  };
}

/**
 * Messages panel container component to bind it to the Redux store.
 */
export default connect(
  // mapStateToProps
  () => {
    const messageListSelector = createMessageListSelector();
    return (state, ownProps) => ({
      chatEntries: messageListSelector(state, ownProps.uavId),
      commandHistory: getCommandHistory(state),
      optimizeUIForTouch: shouldOptimizeUIForTouch(state),
    });
  },

  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onClearMessages() {
      dispatch(clearMessagesOfUAVById(ownProps.uavId));
    },

    async onSend(message) {
      const { uavId } = ownProps;

      if (!uavId) {
        return;
      }

      // Dispatch a Redux action. This will update the store but will not
      // send any actual message
      const action = addOutboundMessage({ message, uavId });
      dispatch(action);

      // Parse the message and extract positional and keyword arguments
      const { command, args, kwds } = parseCommandFromString(message);

      // Now also send the message via the message hub
      const { messageId } = action;

      try {
        const result = await messageHub.sendCommandRequest(
          {
            uavId,
            command,
            args,
            kwds,
          },
          {
            onProgress({ progress, suspended }) {
              dispatch(
                updateProgressByMessageId({ messageId, progress, suspended })
              );
            },
          }
        );
        const formattedMessage = formatCommandResponseAsHTML(result);
        dispatch(
          addInboundMessage({
            message: formattedMessage,
            uavId,
            refs: messageId,
          })
        );
      } catch (error) {
        const errorMessage = error.userMessage || error.message;
        dispatch(
          addErrorMessage({ message: errorMessage, uavId, refs: messageId })
        );
      }
    },
  }),

  // mergeProps
  null,

  // options
  { forwardRef: true }

  // ref is needed because we want to access the scrollToBottom() method
  // from the outside
)(withStyles(styles)(MessagesPanel));
