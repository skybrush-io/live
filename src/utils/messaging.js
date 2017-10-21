/**
 * @file Utility file for sharing messaging related code between components.
 */

import messageHub from '../message-hub'
import store from '../store'
import { addLogItem } from '../actions/log'

export const takeoffUAVs = (uavs) => {
  messageHub.sendMessage({
    type: 'UAV-TAKEOFF',
    ids: uavs
  }).then(result => {
    store.dispatch(addLogItem({
      level: 0,
      content: 'Takeoff command issued and response received.'
    }))
    console.log(result)
  })
}

export const landUAVs = (uavs) => {
  messageHub.sendMessage({
    type: 'UAV-LAND',
    ids: uavs
  }).then(result => {
    store.dispatch(addLogItem({
      level: 0,
      content: 'Land command issued and response received.'
    }))
    console.log(result)
  })
}

export const returnToHomeUAVs = (uavs) => {
  messageHub.sendMessage({
    type: 'UAV-RTH',
    ids: uavs
  }).then(result => {
    store.dispatch(addLogItem({
      level: 0,
      content: 'Return to home command issued and response received.'
    }))
    console.log(result)
  })
}

export const toggleErrorUAVs = (() => {
  let currentError = []

  return (uavs) => {
    currentError =
      currentError.length === 0
      ? [Math.floor(Math.random() * 256)]
      : []

    messageHub.sendMessage({
      type: 'CMD-REQ',
      ids: uavs,
      command: 'error',
      args: currentError
    }).then(result => {
      store.dispatch(addLogItem({
        level: 0,
        content: currentError.length === 0
        ? `The error state of UAVs ${uavs} were cleared.`
        : `UAVs ${uavs} were sent to error state ${currentError}.`
      }))
      console.log(result)
    })
  }
})()
