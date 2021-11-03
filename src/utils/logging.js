/**
 * @file Utility file providing a better interface for logging related actions.
 */

import Colors, { colorForSeverity } from '~/components/colors';
import { addLogItem } from '~/features/log/slice';
import { Severity } from '~/model/enums';
import store from '~/store';

export const LogLevel = {
  DEBUG: 0,
  INFO: 10,
  WARNING: 20,
  ERROR: 30,
  FATAL: 40,
};

const colorMap = {
  [LogLevel.DEBUG]: Colors.off,
  [LogLevel.INFO]: colorForSeverity(Severity.INFO),
  [LogLevel.WARNING]: colorForSeverity(Severity.WARNING),
  [LogLevel.ERROR]: colorForSeverity(Severity.ERROR),
  [LogLevel.FATAL]: colorForSeverity(Severity.FATAL),
};

export function colorForLogLevel(level) {
  if (level <= LogLevel.DEBUG) {
    return colorMap[LogLevel.DEBUG];
  }

  if (level <= LogLevel.INFO) {
    return colorMap[LogLevel.INFO];
  }

  if (level <= LogLevel.WARNING) {
    return colorMap[LogLevel.WARNING];
  }

  if (level <= LogLevel.ERROR) {
    return colorMap[LogLevel.ERROR];
  }

  if (level <= LogLevel.FATAL) {
    return colorMap[LogLevel.FATAL];
  }

  return Colors.off;
}

export function logLevelForLogLevelName(name) {
  if (name === 'CRITICAL') {
    name = 'FATAL';
  }

  return LogLevel[name] || 'DEBUG';
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

const makeLogger = (module) => new Logger(String(module || ''));

export default makeLogger;
