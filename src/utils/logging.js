/**
 * @file Utility file providing a better interface for logging related actions.
 */

import store from '../store';
import { addLogItem } from '~/features/log/slice';

export const LogLevel = {
  DEBUG: 0,
  INFO: 10,
  WARNING: 20,
  ERROR: 30,
  FATAL: 40
};

export function colorForLogLevel(level) {
  if (level <= LogLevel.DEBUG) {
    return '#666';
  }

  if (level <= LogLevel.INFO) {
    return '#08f';
  }

  if (level <= LogLevel.WARNING) {
    return '#fb0';
  }

  if (level <= LogLevel.ERROR) {
    return '#f60';
  }

  if (level <= LogLevel.FATAL) {
    return '#a00';
  }

  return '#000';
}

function Logger(module) {
  const add_ = function (level, message) {
    store.dispatch(addLogItem({ level, message: String(message), module }));
  };

  const assert_ = function (condition, message) {
    if (!condition) {
      this.debug(message);
    }
  };

  this.debug = add_.bind(this, LogLevel.DEBUG);
  this.error = add_.bind(this, LogLevel.ERROR);
  this.info = add_.bind(this, LogLevel.INFO);
  this.log = this.info;
  this.warn = add_.bind(this, LogLevel.WARNING);
  this.assert = assert_.bind(this);
}

export default (module) => new Logger(String(module || ''));
