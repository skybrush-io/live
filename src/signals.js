/**
 * @file Defines the singleton instance of the applicaiton-wide signals object.
 */

import Signal from 'mini-signals'

export const mapReferenceRequestSignal = new Signal()

export const mapRotationResetSignal = new Signal()
export const fitAllFeaturesSignal = new Signal()

export const mapViewToLocationSignal = new Signal()
export const mapViewToExtentSignal = new Signal()
export const addListenerToMapViewSignal = new Signal()
export const removeListenerFromMapViewSignal = new Signal()

export const focusMessagesDialogUAVSelectorField = new Signal()

/**
 * The singleton object instance containing the signals used in the application.
 */
export default {
  mapReferenceRequestSignal,

  mapRotationResetSignal,
  fitAllFeaturesSignal,

  mapViewToLocationSignal,
  mapViewToExtentSignal,
  addListenerToMapViewSignal,
  removeListenerFromMapViewSignal,

  focusMessagesDialogUAVSelectorField
}
