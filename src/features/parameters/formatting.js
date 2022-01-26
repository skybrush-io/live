/*
 * Parameters are canonically represented as arrays where each item is shaped
 * as { name, value }. The user manipulates them as strings of the format
 * "name=value", one parameter per line.
 */

export function formatParameters(parameters) {
  const rows = parameters.map(({ name, value }) => `${name}=${value}`);
  return rows.join('\n');
}

export function parseParameters(parameterString) {
  const result = [];
  let lineNumber = 0;

  for (let line of (parameterString || '').split('\n')) {
    lineNumber++;

    line = line.trim();
    if (line.length === 0) {
      // Empty line, skip it
      continue;
    }

    if (line.startsWith('#') || line.startsWith('//')) {
      // Line is a comment line, skip it
      continue;
    }

    const eqIndex = line.replace(',', '=').indexOf('=');
    if (eqIndex < 0) {
      throw new Error(
        `Line ${lineNumber} does not contain an equals sign (=) or a comma.`
      );
    }

    const name = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();

    if (name.length === 0) {
      throw new Error(
        `Line ${lineNumber} contains no parameter name, only a value`
      );
    }

    result.push({ name, value });
  }

  return result;
}
