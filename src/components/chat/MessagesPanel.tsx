/**
 * @file The "Messages" dialog that allows the user to send console messages
 * to the UAVs.
 */

import DeleteSweep from '@mui/icons-material/DeleteSweep';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import formatDate from 'date-fns/format';
import isNil from 'lodash-es/isNil';
import React from 'react';
import { connect } from 'react-redux';

import {
  BackgroundHint,
  type BackgroundHintProps,
} from '@skybrush/mui-components';

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
import type { Message } from '~/features/messages/types';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import {
  formatCommandResponseAsHTML,
  type PlainOrPreformattedResponse,
} from '~/flockwave/formatting';
import { parseCommandFromString } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import { MessageType } from '~/model/enums';
import type { RootState } from '~/store/reducers';

import ChatArea from './ChatArea';
import ChatBubble from './ChatBubble';
import Marker from './Marker';
import MessageField from './MessageField';

const dateFormatter = (x: number | Date) => formatDate(x, 'H:mm');

type FormatterState = {
  author?: string;
  date?: number;
  formattedDate?: string;
};

/**
 * Converts a message object from the Redux store into React components
 * that can render it nicely.
 */
function convertMessageToComponent(
  message: Message,
  state: FormatterState = {}
): React.ReactNode {
  const keyBase = `message${message.id}`;
  const inProgress = !message.responseId;
  const dateIsNumber = typeof message.date === 'number';
  const formattedDate = dateIsNumber ? dateFormatter(message.date) : '';
  const author = message.author;
  // state.date may be undefined on the first call, but the subtraction
  // yields NaN and Math.abs(NaN) < 500 is false, so this is safe.
  const isCloseToPreviousEntry =
    dateIsNumber && Math.abs(state.date! - message.date) < 500;
  const showMeta =
    state.author !== author ||
    (state.formattedDate !== formattedDate && !isCloseToPreviousEntry);

  state.author = author;
  state.date = message.date;
  if (!isCloseToPreviousEntry) {
    state.formattedDate = formattedDate;
  }

  switch (message.type) {
    case MessageType.OUTBOUND:
      return (
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
            ) : undefined
          }
        />
      );

    case MessageType.INBOUND:
      return (
        <ChatBubble
          key={keyBase}
          showMeta={showMeta}
          author={author}
          own={false}
          raw={message.raw}
          date={formattedDate}
          body={message.body}
          severity={message.severity}
        />
      );

    case MessageType.ERROR:
      return (
        <Marker key={keyBase + 'Marker'} level='error' message={message.body} />
      );

    default:
      return (
        <Marker
          key={keyBase + 'Marker'}
          level='error'
          message={`Invalid message type: ${message.type}`}
        />
      );
  }
}

type ChatAreaBackgroundHintProps = {
  hasSelectedUAV: boolean;
  textFieldPlacement: 'bottom' | 'top';
} & Omit<BackgroundHintProps, 'header' | 'text'>;

/**
 * Specialized background hint for the chat area.
 */
const ChatAreaBackgroundHint = ({
  hasSelectedUAV,
  textFieldPlacement,
  ...rest
}: ChatAreaBackgroundHintProps) =>
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

type MessagesPanelOwnProps = {
  hideClearButton?: boolean;
  style?: React.CSSProperties;
  textFieldPlacement?: 'bottom' | 'top';
  uavId?: string;
};

type MessagesPanelStateProps = {
  chatEntries: Message[];
  commandHistory: string[];
  optimizeUIForTouch: boolean;
};

type MessagesPanelDispatchProps = {
  onClearMessages: () => void;
  onSend: (message: string) => void;
};

type MessagesPanelProps = MessagesPanelOwnProps &
  MessagesPanelStateProps &
  MessagesPanelDispatchProps;

/**
 * Presentation component for the "Messages" panel, containing a text field
 * to type the messages into, and a target UAV selector.
 */
class MessagesPanel extends React.Component<MessagesPanelProps, never> {
  private readonly _chatAreaRef = React.createRef<ChatArea>();
  private readonly _messageFieldRef = React.createRef<HTMLInputElement>();
  private readonly _messageFieldContainerRef =
    React.createRef<HTMLDivElement>();

  render() {
    const {
      chatEntries,
      commandHistory,
      hideClearButton,
      onClearMessages,
      optimizeUIForTouch,
      style,
      textFieldPlacement = 'bottom',
      uavId,
    } = this.props;

    const formatterState: FormatterState = {};
    const chatComponents = chatEntries.map((entry) =>
      convertMessageToComponent(entry, formatterState)
    );
    const contentStyle: React.CSSProperties = {
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
    const isClearButtonVisible = !hideClearButton;
    const textFields = (
      <Box
        ref={this._messageFieldContainerRef}
        key='textFieldContainer'
        className='bottom-bar'
        tabIndex={-1}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.code === 'Enter') {
            this._messageFieldRef.current?.focus();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          pb: 2,
          pl: 2,
          pr: isClearButtonVisible ? 0 : 2,
          '&:focus': {
            outline: 'none',
          },
        }}
      >
        <MessageField
          fullWidth
          autoFocus={!optimizeUIForTouch}
          history={commandHistory}
          inputRef={this._messageFieldRef}
          variant='standard'
          onSubmit={this._onSubmit}
          onEscape={(e: React.KeyboardEvent<HTMLInputElement>) => {
            this._messageFieldContainerRef.current?.focus();
            e.stopPropagation();
          }}
        />
        {isClearButtonVisible && (
          <IconButton
            disabled={chatComponents.length === 0}
            size='large'
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

  _onSubmit = (message: string) => {
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
    return (state: RootState, ownProps: MessagesPanelOwnProps) => ({
      chatEntries: messageListSelector(state, ownProps.uavId),
      commandHistory: getCommandHistory(state),
      optimizeUIForTouch: shouldOptimizeUIForTouch(state),
    });
  },

  // mapDispatchToProps
  (dispatch, ownProps: MessagesPanelOwnProps) => ({
    onClearMessages() {
      if (ownProps.uavId !== undefined) {
        dispatch(clearMessagesOfUAVById(ownProps.uavId));
      }
    },

    async onSend(message: string) {
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

      // addOutboundMessage() added the ID of the newly created message to the
      // { messageId } field of the action so we need to cast the type of the action
      // below.
      //
      // Now also send the message via the message hub
      const { messageId } = action as typeof action & { messageId: string };

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

        if (!isNil(result)) {
          const formattedMessage = formatCommandResponseAsHTML(
            result as PlainOrPreformattedResponse
          );
          dispatch(
            addInboundMessage({
              message: formattedMessage,
              uavId,
              refs: messageId,
            })
          );
        }
      } catch (error) {
        const errorMessage =
          (error as { userMessage?: string }).userMessage ||
          (error as Error).message;
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
)(MessagesPanel);
