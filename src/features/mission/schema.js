import isNil from 'lodash-es/isNil';

import { KNOWN_UI_CONTEXTS } from './parameter-context';

/**
 * Utility functions related to handling mission parameter schemas.
 */

const addToObjectOfArrays = (object, key, value) => {
  if (!(key in object)) {
    object[key] = [];
  }

  object[key].push(value);
};

/**
 * Filters a mission parameter JSON schema by sorting the parameters according to the
 * UI context that they should be taken from. Returns two objects:
 *
 * - `schema`: the filtered schema with all references to top-level parameters
 *   to be provided by contextual information from the UI removed
 * - `uiContexts`: a map keyed by UI context identifiers; the values are
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
        if (KNOWN_UI_CONTEXTS.includes(uiContextHint)) {
          addToObjectOfArrays(uiContexts, uiContextHint, key);
          excludedProps.push(key);

          delete value['ui:contextHint'];
        } else {
          console.warn('Unknown UI context hint:' + String(uiContextHint));
        }
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
