/**
 * @file Stories for the UI testing of the ChatBubble component.
 */

import moment from 'moment'
import React from 'react'
import { storiesOf } from '@kadira/storybook'

import { ChatArea, ChatBubble } from '../components/chat'

storiesOf('ChatBubble', module)
  .add('Simple bubble (own)', () => (
    <ChatArea>
      <ChatBubble body={'This is a test message.'} date={moment().toDate()} />
    </ChatArea>
  ))
  .add('Simple bubble (other, no date)', () => (
    <ChatArea>
      <ChatBubble body={'This is a test response from someone.'} own={false} />
    </ChatArea>
  ))
