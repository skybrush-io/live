/**
 * @file Utility file providing a better interface for logging related actions.
 */

import store from '../store'
import { addLogItem } from '../actions/log'

export const LogLevel = {
  DEBUG: 0,
  INFO: 10,
  WARNING: 20,
  WARN: 20,
  ERROR: 30,
  FATAL: 40
}

export function colorForLogLevel (level) {
  if (level <= LogLevel.DEBUG) {
    return '#666'
  } else if (level <= LogLevel.INFO) {
    return '#08f'
  } else if (level <= LogLevel.WARNING) {
    return '#fc0'
  } else {
    return '#f00'
  }
}

function Logger (module) {
  const add_ = function (level, message) {
    store.dispatch(addLogItem({ level, message }))
  }

  const assert_ = function (condition, message) {
    if (!condition) {
      this.debug(message)
    }
  }

  this.debug = add_.bind(this, LogLevel.DEBUG)
  this.error = add_.bind(this, LogLevel.ERROR)
  this.info = add_.bind(this, LogLevel.INFO)
  this.log = this.info
  this.warn = add_.bind(this, LogLevel.WARNING)
  this.assert = assert_.bind(this)
}

export default module => new Logger(module)
