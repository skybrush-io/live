import formatDate from 'date-fns/format';
import fromUnixTime from 'date-fns/fromUnixTime';
import isNil from 'lodash-es/isNil';
import { Base64 } from 'js-base64';

import { FlightLogKind } from './enums';

export { FlightLogKind } from './enums';

/**
 * Converts a flight log received from the server with a LOG-DATA command to
 * an object holding a proposed filename and a binary blob to be written to the
 * file.
 */
export function convertFlightLogToBlob(flightLog) {
  const { kind, body } = flightLog;
  let blob;

  switch (kind) {
    case FlightLogKind.TEXT:
      blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      break;

    default:
      blob = new Blob([Base64.toUint8Array(body)], {
        type: 'application/octet-stream',
      });
      break;
  }

  return { filename: proposeFilenameForFlightLog(flightLog), blob };
}

const _EXTENSIONS_FOR_FLIGHT_LOG_KINDS = {
  [FlightLogKind.TEXT]: '.txt',
  [FlightLogKind.ARDUPILOT]: '.bin',
  [FlightLogKind.ULOG]: '.ulg',
  [FlightLogKind.UNKNOWN]: '.log',
  [FlightLogKind.FLOCKCTRL]: '.log',
};

/**
 * Proposes a filename for a flight log.
 */
export function proposeFilenameForFlightLog(flightLog) {
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
