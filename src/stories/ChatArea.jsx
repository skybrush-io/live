/**
 * @file Stories for the UI testing of the ChatArea component.
 */

import moment from 'moment'
import React from 'react'
import { storiesOf } from '@kadira/storybook'

import { ChatArea, ChatBubble, Marker, Separator } from '../components/chat'

storiesOf('ChatArea', module)
  .add('Short chat session', () => (
    <ChatArea>
      <ChatBubble author={'Operator'} body={'foo bar'}
        date={moment().subtract(3, 'minutes').toDate()} />
      <ChatBubble author={'UAV 01'} body={'yo!'} own={false}
        date={moment().subtract(2, 'minutes').toDate()} />
      <ChatBubble author={'Operator'} body={'yo?'}
        date={moment().subtract(1, 'minute').toDate()} />
    </ChatArea>
  ))
  .add('Chat session with markers', () => (
    <ChatArea>
      <Separator message={'Chat session started'} />
      <ChatBubble author={'Operator'} body={'foo bar'}
        date={moment().subtract(3, 'minutes').toDate()} />
      <Marker message={'Response takes longer than usual'}
        level={'warning'}
        date={moment().subtract(2.5, 'minutes').toDate()} />
      <ChatBubble author={'UAV 01'} body={'yo!'} own={false}
        date={moment().subtract(2, 'minutes').toDate()} />
      <ChatBubble author={'Operator'} body={'yo?'}
        date={moment().subtract(1, 'minute').toDate()} />
      <Marker message={'Timeout while waiting for response'}
        level={'error'} date={moment().toDate()} />
      <Separator />
    </ChatArea>
  ))
