/*
 * Parameters are canonically represented as arrays where each item is shaped
 * as { name, value, uavId? }. The user manipulates them as strings of the format
 * "name=value" or "uavId=name=value", one parameter per line.
 */

import type { ParameterData } from './types';

export function formatParameters(parameters: ParameterData[]): string {
  const rows = parameters.map(({ uavId, name, value }) =>
    uavId === undefined ? `${name}=${value}` : `${uavId}=${name}=${value}`
  );
  return rows.length > 0 ? rows.join('\n') + '\n' : '';
}

export function parseParameters(parameterString: string): ParameterData[] {
  const result: ParameterData[] = [];
  let lineNumber = 0;

  for (let line of (parameterString || '').split('\n')) {
    lineNumber++;

    // replaceAll() would be more efficient, but this implementation at least
    // attempts to preserve "," characters in the value, assuming the line
    // also contains a UAV ID.
    line = line.trim().replace(',', '=').replace(',', '=');
    if (line.length === 0) {
      // Empty line, skip it
      continue;
    }

    if (line.startsWith('#') || line.startsWith('//')) {
      // Line is a comment line, skip it
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex < 0) {
      throw new Error(
        `Line ${lineNumber} does not contain an equals sign (=) or a comma.`
      );
    }

    const secondEqIndex = line.indexOf('=', eqIndex + 1);

    const [uavId, name, value] =
      secondEqIndex < 0
        ? [
            undefined,
            line.slice(0, eqIndex).trim(),
            line.slice(eqIndex + 1).trim(),
          ]
        : [
            line.slice(0, eqIndex).trim(),
            line.slice(eqIndex + 1, secondEqIndex).trim(),
            line.slice(secondEqIndex + 1).trim(),
          ];

    if (name.length === 0) {
      throw new Error(
        `Line ${lineNumber} contains no parameter name, only a value`
      );
    }

    if (uavId !== undefined && uavId.length === 0) {
      throw new Error(`Line ${lineNumber} contains empty UAV ID`);
    }

    result.push({ name, uavId, value });
  }

  return result;
}
