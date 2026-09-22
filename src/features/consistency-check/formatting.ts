import { parsePartialParameters } from '~/features/upload-support/setup-dialog/parsing';

/**
 * Parses a multi-line string into a list of parameter names.
 *
 * The function expects the input to be in a format accepted by
 * `parsePartialParameters()` in `features/upload-support/setup-dialog/parsing.ts`.
 */
export function parseParameterNames(input: string): string[] {
  return parsePartialParameters(input).map(({ name }) => name);
}
