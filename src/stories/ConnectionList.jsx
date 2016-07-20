/**
 * @file Stories for the UI testing of the ConnectionList component.
 *
 * This is currently only for the sake of evaluating <code>react-storybook</code>.
 */

import React from 'react'
import { storiesOf, action } from '@kadira/storybook'

import { ConnectionListPresentation } from '../components/ConnectionList'
import { ConnectionState, MASTER_CONNECTION_ID } from '../model/connections'

import { themedWidget } from './helpers'

storiesOf('ConnectionList', module)
  .add('No connections', themedWidget(() => (
    <ConnectionListPresentation />
  )))
  .add('Single connection', themedWidget(() => (
    <ConnectionListPresentation connections={[{
      id: MASTER_CONNECTION_ID,
      name: 'Main server',
      state: ConnectionState.CONNECTED,
      stateChangedAt: new Date()
    }]} />
  )))
  .add('Multiple connections', themedWidget(() => (
    <ConnectionListPresentation connections={[
      {
        id: MASTER_CONNECTION_ID,
        name: 'Main server',
        state: ConnectionState.CONNECTED,
        stateChangedAt: new Date()
      },
      {
        id: 'other',
        name: 'Some other server',
        state: ConnectionState.CONNECTING,
        stateChangedAt: new Date()
      },
      {
        id: 'another',
        name: 'Yet another server',
        state: ConnectionState.DISCONNECTING,
        stateChangedAt: new Date()
      },
      {
        id: 'wallPlug',
        name: 'Wall plug',
        state: ConnectionState.DISCONNECTED,
        stateChangedAt: new Date()
      }
    ]} onShowSettings={action('showSettings')} />
  )))
