/**
 * @file Utility file for sharing messaging related code between components.
 */

import messageHub from '../message-hub'
import makeLogger from './logging'

const logger = makeLogger('messaging')

export const takeoffUAVs = (uavs) => (
  messageHub.sendMessage({
    type: 'UAV-TAKEOFF',
    ids: uavs
  }).then(result => {
    logger.info('Takeoff command issued and response received.')
  })
)

export const landUAVs = (uavs) => (
  messageHub.sendMessage({
    type: 'UAV-LAND',
    ids: uavs
  }).then(result => {
    logger.info('Land command issued and response received.')
  })
)

export const returnToHomeUAVs = (uavs) => (
  messageHub.sendMessage({
    type: 'UAV-RTH',
    ids: uavs
  }).then(result => {
    logger.info('Return to home command issued and response received.')
  })
)

export const haltUAVs = (uavs) => (
  messageHub.sendMessage({
    type: 'UAV-HALT',
    ids: uavs
  }).then(result => {
    logger.info('Halt command issued and response received.')
  })
)

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
      logger.info(
        currentError.length === 0
          ? `The error state of UAVs ${uavs} were cleared.`
          : `UAVs ${uavs} were sent to error state ${currentError}.`
      )
      console.log(result)
    })
  }
})()
