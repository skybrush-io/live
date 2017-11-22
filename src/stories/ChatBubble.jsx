/**
 * @file Stories for the UI testing of the ChatBubble component.
 */

import moment from 'moment'
import React from 'react'
import { storiesOf } from '@kadira/storybook'

import { CircularProgress } from 'material-ui/Progress'
import { ChatArea, ChatBubble } from '../components/chat'
import { themed } from './helpers'

storiesOf('ChatBubble', module)
  .add('Simple bubble (own)', () => (
    <ChatArea>
      <ChatBubble body='This is a test message.' date={moment().toDate()} />
    </ChatArea>
  ))
  .add('Simple bubble (other, no date)', () => (
    <ChatArea>
      <ChatBubble body='This is a test response from someone.' own={false} />
    </ChatArea>
  ))
  .add('Bubble with left component', themed(() => (
    <ChatArea>
      <ChatBubble body='This is a test message.' date={moment().toDate()}
        leftComponent={<CircularProgress size={0.5} />} />
    </ChatArea>
  )))
  .add('Bubble with right component', themed(() => (
    <ChatArea>
      <ChatBubble body='This is a test message.' date={moment().toDate()}
        rightComponent={<CircularProgress size={0.5} />} />
    </ChatArea>
  )))
