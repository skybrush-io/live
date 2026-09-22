/*
 * Parameters are canonically represented as arrays where each item is shaped
 * as { name, value, uavId? }. The user manipulates them as strings of the format
 * "name=value" or "uavId=name=value", one parameter per line.
 */

import { parsePartialParameters } from '~/features/upload-support/setup-dialog/parsing';

import type { ParameterData } from './types';

export function formatParameters(parameters: ParameterData[]): string {
  const rows = parameters.map(({ uavId, name, value }) =>
    uavId === undefined ? `${name}=${value}` : `${uavId}=${name}=${value}`
  );
  return rows.length > 0 ? rows.join('\n') + '\n' : '';
}

/**
 * Parses a multi-line parameter string into `ParameterData` objects.
 *
 * The function expects the input to be in a format accepted by
 * `parsePartialParameters()` in `features/upload-support/setup-dialog/parsing.ts`.
 *
 * Items without a value throw an error.
 */
export function parseParameters(parameterString: string): ParameterData[] {
  return parsePartialParameters(parameterString).map(
    ({ name, uavId, value, metadata }) => {
      if (value === undefined) {
        throw new Error(
          `Line ${metadata.lineNumber} does not contain an equals sign (=) or a comma.`
        );
      }
      return { name, uavId, value };
    }
  );
}
