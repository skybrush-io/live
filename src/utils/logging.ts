/**
 * @file Utility file providing a better interface for logging related actions.
 */

import Colors, { colorForSeverity } from '~/components/colors';
import { addLogItem } from '~/features/log/slice';
import { Severity } from '~/model/enums';
import store from '~/store';
import type { AppDispatch } from '~/store/reducers';

export const LogLevel: Record<string, number> = {
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
  [LogLevel.FATAL]: colorForSeverity(Severity.CRITICAL),
};

export function colorForLogLevel(level: number): string {
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

export function logLevelForLogLevelName(name: string): number {
  if (name === 'CRITICAL') {
    name = 'FATAL';
  }

  return LogLevel[name] ?? LogLevel['DEBUG'];
}

class Logger {
  constructor(private _module: string) {
    this.debug = this._add.bind(this, LogLevel.DEBUG);
    this.error = this._add.bind(this, LogLevel.ERROR);
    this.info = this._add.bind(this, LogLevel.INFO);
    this.log = this.info;
    this.warn = this._add.bind(this, LogLevel.WARNING);
  }

  get module(): string {
    return this._module;
  }

  _add = (level: number, message: string): void => {
    (store.dispatch as AppDispatch)(
      addLogItem({ level, message: String(message), module: this._module })
    );
  };

  assert = (condition: boolean, message: string): void => {
    if (!condition) {
      this.debug(message);
    }
  };

  debug: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  log: (message: string) => void;
  warn: (message: string) => void;
}

const createLogger = (module: string) => new Logger(String(module || ''));

export default createLogger;
