export function parseParameterNames(input: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  let lineNumber = 0;

  for (let line of (input || '').split('\n')) {
    lineNumber++;

    line = line.trim();

    if (line.length === 0) {
      // Empty line, skip it
      continue;
    }

    if (line.startsWith('#') || line.startsWith('//')) {
      // Line is a comment, skip it
      continue;
    }

    if (line.includes('=')) {
      throw new Error(`Line ${lineNumber} contains an equals sign (=)`);
    }

    if (/\s/.test(line)) {
      throw new Error(`Line ${lineNumber} contains spaces`);
    }

    if (line.length === 0) {
      throw new Error(`Line ${lineNumber} contains an empty parameter name`);
    }

    if (!seen.has(line)) {
      seen.add(line);
      result.push(line);
    }
  }

  return result;
}
