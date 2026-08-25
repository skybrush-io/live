type PartialParameterData = {
  name: string;
  uavId?: string;
  value?: string;
  metadata: {
    /**
     * Which line contained the value in the parsed input.
     *
     * Line numbers are expected to start from 1.
     * */
    lineNumber: number;
  };
};

/**
 * Parses a multi-line parameter string into an array of
 * `PartialParameterData` objects.
 */
export function parsePartialParameters(
  parameterString: string
): PartialParameterData[] {
  const result: PartialParameterData[] = [];
  let lineNumber = 0;

  for (let line of parameterString.split('\n')) {
    lineNumber++; // 1-based line numbers

    // replaceAll() would be more efficient, but this implementation at least
    // attempts to preserve "," characters in the value, assuming the line
    // also contains a UAV ID.
    line = line.trim().replace(',', '=').replace(',', '=');
    if (line.length === 0) {
      // Empty line, skip it
      continue;
    }

    if (line.startsWith('#') || line.startsWith('//')) {
      // Comment line, skip it
      continue;
    }

    const eqIndex = line.indexOf('=');

    if (eqIndex < 0) {
      // No separator: the whole line is a parameter name with no value
      result.push({
        name: line,
        metadata: { lineNumber },
      });
      continue;
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

    result.push({ name, uavId, value, metadata: { lineNumber } });
  }

  return result;
}
