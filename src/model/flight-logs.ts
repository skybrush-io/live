import formatDate from 'date-fns/format';
import fromUnixTime from 'date-fns/fromUnixTime';
import { Base64 } from 'js-base64';
import isNil from 'lodash-es/isNil';

import { FlightLogKind } from './enums';

export { FlightLogKind } from './enums';

export type FlightLog = {
  kind: FlightLogKind;
  body: string;
  id?: string;
  timestamp?: number;
};

const _EXTENSIONS_FOR_FLIGHT_LOG_KINDS: Record<FlightLogKind, string> = {
  [FlightLogKind.TEXT]: '.txt',
  [FlightLogKind.ARDUPILOT]: '.bin',
  [FlightLogKind.ULOG]: '.ulg',
  [FlightLogKind.UNKNOWN]: '.log',
  [FlightLogKind.FLOCKCTRL]: '.log',
};

/**
 * Converts a flight log received from the server with a LOG-DATA command to
 * an object holding a proposed filename and a binary blob to be written to the
 * file.
 */
export function convertFlightLogToBlob(flightLog: FlightLog): {
  filename: string;
  blob: Blob;
} {
  const { kind, body } = flightLog;
  let blob: Blob;

  switch (kind) {
    case FlightLogKind.TEXT:
      blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      break;

    default:
      blob = new Blob([Base64.toUint8Array(body) as Uint8Array<ArrayBuffer>], {
        type: 'application/octet-stream',
      });
      break;
  }

  return { filename: proposeFilenameForFlightLog(flightLog), blob };
}

/**
 * Proposes a filename for a flight log.
 */
export function proposeFilenameForFlightLog(flightLog: FlightLog): string {
  const { id, kind, timestamp } = flightLog;

  const extension =
    _EXTENSIONS_FOR_FLIGHT_LOG_KINDS[kind] ||
    _EXTENSIONS_FOR_FLIGHT_LOG_KINDS[FlightLogKind.UNKNOWN];

  const ts = isNil(timestamp)
    ? undefined
    : formatDate(fromUnixTime(timestamp), 'yyyyMMdd_HHmmss');

  if (isNil(id) && isNil(ts)) {
    return `flight_log${extension}`;
  } else if (isNil(id)) {
    return `${ts}${extension}`;
  } else if (isNil(ts)) {
    return `${id}${extension}`;
  } else {
    return `${id}_${ts}${extension}`;
  }
}
