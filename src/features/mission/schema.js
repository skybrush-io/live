import isNil from 'lodash-es/isNil';

/**
 * Utility functions related to handling mission parameter schemas.
 */

/**
 * Filters a mission parameter JSON schema by sorting the parameters according to the
 * UI context that they should be taken from. Returns two objects:
 *
 * - `schema`: the filtered schema with all references to top-level parameters
 *   to be provided by contextual information from the UI removed
 * - `uiContexts`: an object keyed by UI context identifiers; the values are
 *   arrays of parameters that are to be filled from the given UI context
 *
 * Only JSON schemas with a top-level type of `object` are allowed.
 */
export function filterSchemaByUIContext(schema) {
  if (isNil(schema) || typeof schema !== 'object' || schema.type !== 'object') {
    schema = {};
  }

  schema = structuredClone(schema);

  const uiContexts = {};
  const excludedProps = [];
  const result = { schema, uiContexts };

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      if (value.uiContextHint && !value['ui:contextHint']) {
        value['ui:contextHint'] = value.uiContextHint;
        delete value.uiContextHint;
      }

      if (value['ui:contextHint']) {
        const uiContextHint = value['ui:contextHint'];
        if (!Array.isArray(uiContexts[uiContextHint])) {
          uiContexts[uiContextHint] = [];
        }

        uiContexts[uiContextHint].push(key);
        excludedProps.push(key);

        delete value['ui:contextHint'];
      }
    }

    for (const key of excludedProps) {
      delete schema.properties[key];
    }

    if (schema.required) {
      schema.required = schema.required.filter(
        (x) => !excludedProps.includes(x)
      );
    }
  }

  return result;
}
