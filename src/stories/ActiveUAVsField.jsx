/**
 * @file Stories for the UI testing of the ActiveUAVsField component.
 */

import React from 'react'
import { storiesOf, action } from '@kadira/storybook'

import { UAVSelectorField } from '../components/ActiveUAVsField'
import { themed } from './helpers'

const valueChanged = action('valueChanged')

storiesOf('UAVSelectorField', module)
  .add('No UAVs', themed(() => (
    <UAVSelectorField onValueChanged={valueChanged} />
  )))
  .add('Three fake UAVs', themed(() => (
    <UAVSelectorField onValueChanged={valueChanged}
      uavIds={['FAKE-01', 'FAKE-02', 'FAKE-03']} />
  )))
  .add('Three fake UAVs, initial value', themed(() => (
    <UAVSelectorField onValueChanged={valueChanged}
      uavIds={['FAKE-01', 'FAKE-02', 'FAKE-03']}
      value='FAKE-02' />
  )))
  .add('Five UAVs, custom prompt', themed(() => (
    <UAVSelectorField onValueChanged={valueChanged}
      uavIds={['FAKE-01', 'FAKE-02', 'FAKE-03', '17', '42']}
      prompt='Look ma, custom prompt!' />
  )))
